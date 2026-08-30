"""Face management Lambda: handles getUploadUrl, addFace, deleteFace,
deleteFaceAndImage, listFaces, and getCollectionInfo routes.

Manages student faces in Rekognition collections and corresponding
photos in S3.
"""

import base64
import json
import logging
import os
import re

import boto3
from botocore.client import Config

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Presigned URL bắt buộc ký SigV4 — mặc định của một vài region cũ vẫn là s3v2,
# ký sai phiên bản thì trình duyệt nhận 403 khi PUT.
s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
rekognition = boto3.client("rekognition")

BUCKET_NAME = os.environ.get("BUCKET_NAME", "")
COLLECTION_PREFIX = os.environ.get("COLLECTION_PREFIX", "attendance-system")
UPLOAD_URL_TTL_SECONDS = int(os.environ.get("UPLOAD_URL_TTL_SECONDS", "300"))

SAFE_ID = re.compile(r"^[A-Za-z0-9._-]+$")


def _get_apigw_client(event):
    domain = event["requestContext"]["domainName"]
    stage = event["requestContext"]["stage"]
    endpoint = f"https://{domain}/{stage}"
    return boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)


def _send_to_client(event, payload):
    connection_id = event["requestContext"]["connectionId"]
    client = _get_apigw_client(event)
    client.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(payload).encode("utf-8"),
    )


def _send_error(event, action, message):
    """Payload lỗi PHẢI kèm `action`.

    Frontend gom message theo `action` để trả về đúng chỗ đang chờ; payload lỗi
    thiếu field này rơi vào nhóm chung, component đang chờ không nhận được gì và
    chỉ thoát ra khi hết timeout.
    """
    _send_to_client(event, {"status": "error", "action": action, "message": message})


def _photo_key(class_id, student_id):
    return f"classes/{class_id}/{student_id}.jpg"


def _valid_ids(class_id, student_id):
    return bool(SAFE_ID.match(class_id or "")) and bool(SAFE_ID.match(student_id or ""))


def _handle_get_upload_url(event, body):
    """Cấp presigned PUT URL để client đẩy ảnh thẳng lên S3.

    WebSocket của API Gateway chỉ chịu được frame 32KB, không đủ cho một tấm ảnh
    khuôn mặt tử tế — nên ảnh đi đường S3, WebSocket chỉ mang s3Key.
    """
    class_id = body.get("classId", "")
    student_id = body.get("studentId", "")

    if not class_id or not student_id:
        _send_error(event, "getUploadUrl", "Missing classId or studentId")
        return
    if not _valid_ids(class_id, student_id):
        _send_error(event, "getUploadUrl", "classId/studentId may only contain letters, numbers, dots, underscores, and hyphens")
        return

    s3_key = _photo_key(class_id, student_id)
    upload_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": s3_key,
            "ContentType": "image/jpeg",
        },
        ExpiresIn=UPLOAD_URL_TTL_SECONDS,
    )

    _send_to_client(event, {
        "status": "success",
        "action": "getUploadUrl",
        "uploadUrl": upload_url,
        "s3Key": s3_key,
        "contentType": "image/jpeg",
        "expiresIn": UPLOAD_URL_TTL_SECONDS,
    })


def _handle_add_face(event, body):
    class_id = body.get("classId", "")
    student_id = body.get("studentId", "")
    image_data = body.get("image", "")
    s3_key_from_client = body.get("s3Key", "")

    if not class_id or not student_id:
        _send_error(event, "addFace", "Missing classId or studentId")
        return
    if not image_data and not s3_key_from_client:
        _send_error(event, "addFace", "Missing image or s3Key")
        return
    if not _valid_ids(class_id, student_id):
        _send_error(event, "addFace", "classId/studentId may only contain letters, numbers, dots, underscores, and hyphens")
        return

    s3_key = _photo_key(class_id, student_id)

    if s3_key_from_client:
        # Chỉ nhận đúng key mà getUploadUrl đã cấp — không để client tự chỉ định
        # một object bất kỳ trong bucket rồi bảo Rekognition đọc nó.
        if s3_key_from_client != s3_key:
            _send_error(event, "addFace", "s3Key does not match classId/studentId")
            return
        image_source = {"S3Object": {"Bucket": BUCKET_NAME, "Name": s3_key}}
    else:
        image_bytes = base64.b64decode(image_data)
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=image_bytes,
            ContentType="image/jpeg",
        )
        image_source = {"Bytes": image_bytes}

    collection_id = f"{COLLECTION_PREFIX}-{class_id}"

    response = rekognition.index_faces(
        CollectionId=collection_id,
        Image=image_source,
        ExternalImageId=student_id,
        DetectionAttributes=["DEFAULT"],
        MaxFaces=1,
        QualityFilter="AUTO",
    )

    face_records = response.get("FaceRecords", [])
    if not face_records:
        # Ảnh đã nằm trên S3 trước khi biết có mặt người hay không — không dọn thì
        # sinh viên có ảnh đại diện mà Rekognition lại không có face nào tương ứng.
        try:
            s3.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
        except Exception:
            logger.warning("Failed to clean up S3 object after failed indexing: %s", s3_key)

        _send_error(event, "addFace", "No face detected in the provided image")
        return

    face = face_records[0]["Face"]
    _send_to_client(event, {
        "status": "success",
        "action": "addFace",
        "faceId": face["FaceId"],
        "studentId": student_id,
        "classId": class_id,
        "imageKey": s3_key,
    })


def _handle_delete_face(event, body):
    class_id = body.get("classId", "")
    face_id = body.get("faceId", "")

    if not class_id or not face_id:
        _send_error(event, "deleteFace", "Missing classId or faceId")
        return

    collection_id = f"{COLLECTION_PREFIX}-{class_id}"

    rekognition.delete_faces(
        CollectionId=collection_id,
        FaceIds=[face_id],
    )

    _send_to_client(event, {
        "status": "success",
        "action": "deleteFace",
        "faceId": face_id,
        "classId": class_id,
    })


def _handle_delete_face_and_image(event, body):
    class_id = body.get("classId", "")
    face_id = body.get("faceId", "")
    student_id = body.get("studentId", "")

    if not all([class_id, face_id, student_id]):
        _send_error(event, "deleteFaceAndImage", "Missing classId, faceId, or studentId")
        return

    collection_id = f"{COLLECTION_PREFIX}-{class_id}"

    rekognition.delete_faces(
        CollectionId=collection_id,
        FaceIds=[face_id],
    )

    s3_key = _photo_key(class_id, student_id)
    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
    except Exception:
        logger.warning("Failed to delete S3 object: %s", s3_key)

    _send_to_client(event, {
        "status": "success",
        "action": "deleteFaceAndImage",
        "faceId": face_id,
        "studentId": student_id,
        "classId": class_id,
    })


def _handle_list_faces(event, body):
    class_id = body.get("classId", "")

    if not class_id:
        _send_error(event, "listFaces", "Missing classId")
        return

    collection_id = f"{COLLECTION_PREFIX}-{class_id}"

    faces = []
    next_token = None

    while True:
        kwargs = {"CollectionId": collection_id, "MaxResults": 100}
        if next_token:
            kwargs["NextToken"] = next_token

        response = rekognition.list_faces(**kwargs)
        for face in response.get("Faces", []):
            faces.append({
                "faceId": face["FaceId"],
                "externalImageId": face.get("ExternalImageId", ""),
                "confidence": round(face.get("Confidence", 0), 2),
            })

        next_token = response.get("NextToken")
        if not next_token:
            break

    _send_to_client(event, {
        "status": "success",
        "action": "listFaces",
        "classId": class_id,
        "faces": faces,
        "count": len(faces),
    })


def _handle_get_collection_info(event, body):
    class_id = body.get("classId", "")

    if not class_id:
        _send_error(event, "getCollectionInfo", "Missing classId")
        return

    collection_id = f"{COLLECTION_PREFIX}-{class_id}"

    try:
        response = rekognition.describe_collection(CollectionId=collection_id)
        _send_to_client(event, {
            "status": "success",
            "action": "getCollectionInfo",
            "classId": class_id,
            "collectionId": collection_id,
            "faceCount": response.get("FaceCount", 0),
            "creationTimestamp": str(response.get("CreationTimestamp", "")),
        })
    except rekognition.exceptions.ResourceNotFoundException:
        _send_error(event, "getCollectionInfo", f"Collection not found: {collection_id}")


ROUTE_HANDLERS = {
    "getUploadUrl": _handle_get_upload_url,
    "addFace": _handle_add_face,
    "deleteFace": _handle_delete_face,
    "deleteFaceAndImage": _handle_delete_face_and_image,
    "listFaces": _handle_list_faces,
    "getCollectionInfo": _handle_get_collection_info,
}


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        _send_to_client(event, {"status": "error", "message": "Invalid JSON"})
        return {"statusCode": 400}

    action = body.get("action", "")
    handler = ROUTE_HANDLERS.get(action)

    if not handler:
        _send_error(event, action or "unknown", f"Unknown action: {action}")
        return {"statusCode": 400}

    try:
        handler(event, body)
    except Exception:
        logger.exception("Error processing action=%s", action)
        _send_error(event, action, "Internal server error")
        return {"statusCode": 500}

    return {"statusCode": 200}
