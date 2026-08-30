"""Attendance Lambda: handles compare and upload routes.

Flow:
  1. Client sends base64-encoded image via WebSocket
  2. Lambda decodes and uploads to S3 (history/<class_id>/<date>/<timestamp>.jpg)
  3. For 'compare': calls Rekognition SearchFacesByImage against the class collection
  4. Posts attendance record to backend API (/api/device/attendance)
  5. Sends result back to the client via @connections, trong ĐÚNG hình dạng
     firmware parse (xem handleMessage lambda trong websocket.cpp): status
     "success"/"partial_success"/"error", face_compare_result.match_found,
     attendance_result.class_info + attendance_result.attendance_result.status.
"""

import base64
import json
import logging
import os
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

s3 = boto3.client("s3")
rekognition = boto3.client("rekognition")

BUCKET_NAME = os.environ.get("BUCKET_NAME", "")
COLLECTION_PREFIX = os.environ.get("COLLECTION_PREFIX", "attendance-system")
FACE_MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", "95"))
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "")
BACKEND_SERVICE_TOKEN = os.environ.get("BACKEND_SERVICE_TOKEN", "")

VN_TZ = timezone(timedelta(hours=7))


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


def _upload_image(image_bytes, class_id):
    now = datetime.now(VN_TZ)
    key = f"history/{class_id}/{now.strftime('%Y-%m-%d')}/{now.strftime('%H%M%S_%f')}.jpg"
    s3.put_object(Bucket=BUCKET_NAME, Key=key, Body=image_bytes, ContentType="image/jpeg")
    return key


def _search_face(image_bytes, collection_id):
    try:
        response = rekognition.search_faces_by_image(
            CollectionId=collection_id,
            Image={"Bytes": image_bytes},
            FaceMatchThreshold=FACE_MATCH_THRESHOLD,
            MaxFaces=1,
        )
    except rekognition.exceptions.InvalidParameterException:
        logger.warning("No face detected in image")
        return None

    matches = response.get("FaceMatches", [])
    if not matches:
        return None

    match = matches[0]
    return {
        "face_id": match["Face"]["FaceId"],
        "external_image_id": match["Face"].get("ExternalImageId", ""),
        "similarity": round(match["Similarity"], 2),
    }


def _notify_backend(student_id, class_id, image_key):
    """Ghi điểm danh thật vào DB qua backend. Trả về (status_code, body_dict);
    status_code là None nếu không gọi được backend (network/DNS lỗi)."""
    if not BACKEND_API_URL:
        return None, {"message": "BACKEND_API_URL not configured"}

    payload = json.dumps({
        "studentId": student_id,
        "classId": class_id,
        "imageKey": image_key,
        "timestamp": datetime.now(VN_TZ).isoformat(),
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BACKEND_API_URL}/api/device/attendance",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {BACKEND_SERVICE_TOKEN}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # 404 (sinh viên không tồn tại) / 409 (không có tiết học đang diễn ra)
        # đều là lỗi nghiệp vụ hợp lệ, không phải lỗi hệ thống — backend đã trả
        # JSON có message rõ ràng, đọc lại để hiển thị đúng lên LCD.
        try:
            body = json.loads(e.read().decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            body = {"message": str(e)}
        return e.code, body
    except urllib.error.URLError as e:
        logger.error("Failed to notify backend: %s", e)
        return None, {"message": str(e)}


def _class_id_of(body):
    # ESP32-CAM gửi "class_id" (snake_case, xem websocketSendCompare trong firmware);
    # frontend gửi "classId" (camelCase, xem src/api/websocket/faceManagement.jsx).
    # Chấp nhận cả hai để không phải đổi giao thức đã build sẵn trên thiết bị thật.
    return body.get("class_id") or body.get("classId", "")


def _handle_compare(event, body):
    image_data = body.get("image", "")
    class_id = _class_id_of(body)

    if not image_data or not class_id:
        _send_to_client(event, {"status": "error", "message": "Missing image or classId"})
        return

    image_bytes = base64.b64decode(image_data)

    image_key = _upload_image(image_bytes, class_id)
    logger.info("Uploaded image: %s", image_key)

    collection_id = f"{COLLECTION_PREFIX}-{class_id}"
    match_result = _search_face(image_bytes, collection_id)

    if not match_result:
        _send_to_client(event, {
            "status": "success",
            "face_compare_result": {"match_found": False},
        })
        return

    student_id = match_result["external_image_id"]
    face_compare_result = {
        "match_found": True,
        "student_id": student_id,
        "external_id": student_id,
        "similarity": match_result["similarity"],
    }

    status_code, backend_body = _notify_backend(student_id, class_id, image_key)

    if status_code in (200, 201):
        data = backend_body.get("data", {})
        _send_to_client(event, {
            "status": "success",
            "face_compare_result": face_compare_result,
            "attendance_result": {
                "class_info": data.get("class_info", {}),
                "attendance_result": {
                    "status": data.get("remark", ""),
                    "message": backend_body.get("message", ""),
                },
            },
        })
    else:
        # Nhận diện đúng người nhưng không ghi được điểm danh (không có tiết học
        # đang diễn ra, sinh viên không tồn tại, hoặc backend không phản hồi).
        _send_to_client(event, {
            "status": "partial_success",
            "face_compare_result": face_compare_result,
            "attendance_result": {
                "message": backend_body.get("message", "Unable to record attendance"),
                "reason": backend_body.get("reason", ""),
            },
        })


def _handle_upload(event, body):
    image_data = body.get("image", "")
    class_id = _class_id_of(body)

    if not image_data or not class_id:
        _send_to_client(event, {"status": "error", "message": "Missing image or classId"})
        return

    image_bytes = base64.b64decode(image_data)
    image_key = _upload_image(image_bytes, class_id)

    _send_to_client(event, {
        "status": "success",
        "action": "upload",
        "imageKey": image_key,
    })


ROUTE_HANDLERS = {
    "compare": _handle_compare,
    "upload": _handle_upload,
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
        _send_to_client(event, {"status": "error", "message": f"Unknown action: {action}"})
        return {"statusCode": 400}

    try:
        handler(event, body)
    except Exception:
        logger.exception("Error processing action=%s", action)
        _send_to_client(event, {"status": "error", "message": "Internal server error"})
        return {"statusCode": 500}

    return {"statusCode": 200}
