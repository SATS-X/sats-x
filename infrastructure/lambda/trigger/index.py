"""Device command Lambda: remote capture and firmware updates over MQTT.

Lệnh chụp dùng lại đúng payload {"event_type": "compare"} mà cảm biến khoảng cách
đã publish, nên không cần firmware riêng cho việc này (xem lib/mqtt/mqtt.cpp).
device_id là tuỳ chọn: có thì chỉ đúng thiết bị đó thực hiện lệnh.
"""

import json
import logging
import os
import re
from datetime import datetime, timezone, timedelta

import boto3
from botocore.client import Config

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

VN_TZ = timezone(timedelta(hours=7))

IOT_ENDPOINT = os.environ.get("IOT_ENDPOINT", "")
CAPTURE_TOPIC = os.environ.get("CAPTURE_TOPIC", "esp32/attendance-system")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "")

FIRMWARE_PREFIX = "firmware/"
FIRMWARE_URL_TTL_SECONDS = 900
VERSION = re.compile(r"^[A-Za-z0-9._-]{1,32}$")
DEVICE_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
STAFF_ROLES = ("teacher", "admin")

iot_data = boto3.client("iot-data", endpoint_url=f"https://{IOT_ENDPOINT}") if IOT_ENDPOINT else None
s3 = boto3.client("s3", config=Config(signature_version="s3v4"))


def _get_apigw_client(event):
    domain = event["requestContext"]["domainName"]
    stage = event["requestContext"]["stage"]
    endpoint = f"https://{domain}/{stage}"
    return boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)


def _send_to_client(event, payload):
    connection_id = event["requestContext"]["connectionId"]
    client = _get_apigw_client(event)
    try:
        client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(payload).encode("utf-8"),
        )
    except client.exceptions.GoneException:
        logger.warning("Connection %s is closed; the response could not be delivered", connection_id)


def _publish(payload):
    iot_data.publish(topic=CAPTURE_TOPIC, qos=1, payload=json.dumps(payload))


def _trigger_capture(event, body):
    device_id = body.get("device_id")
    if device_id is not None and not (isinstance(device_id, str) and DEVICE_ID.match(device_id)):
        return "error", "Invalid device_id", {}

    now = datetime.now(VN_TZ)
    payload = {
        "event_type": "compare",
        "day": now.day,
        "month": now.month,
        "year": now.year,
        "hour": now.hour,
        "minute": now.minute,
        "second": now.second,
        "distance": 0,
        "triggered_by": "dashboard",
    }
    if device_id:
        payload["device_id"] = device_id

    _publish(payload)
    logger.info("Published capture command to %s", device_id or "all devices")
    return "success", "Capture command sent to device", {}


def _list_firmware(event, body):
    page = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=FIRMWARE_PREFIX)
    releases = [
        {
            "version": item["Key"][len(FIRMWARE_PREFIX):-len(".bin")],
            "size": item["Size"],
            "uploaded_at": item["LastModified"].isoformat(),
        }
        for item in page.get("Contents", [])
        if item["Key"].endswith(".bin")
    ]
    releases.sort(key=lambda release: release["uploaded_at"], reverse=True)
    return "success", "", {"releases": releases}


def _update_firmware(event, body):
    role = (event.get("requestContext", {}).get("authorizer") or {}).get("role")
    if role != "admin":
        return "error", "Only administrators can update firmware", {}

    device_id = body.get("device_id")
    version = body.get("version")
    if not (isinstance(device_id, str) and DEVICE_ID.match(device_id)):
        return "error", "Invalid device_id", {}
    if not (isinstance(version, str) and VERSION.match(version)):
        return "error", "Invalid firmware version", {}

    key = f"{FIRMWARE_PREFIX}{version}.bin"
    try:
        head = s3.head_object(Bucket=BUCKET_NAME, Key=key)
    except s3.exceptions.ClientError:
        return "error", f"Firmware {version} was not found", {}

    md5 = head["ETag"].strip('"')
    if "-" in md5:
        return "error", "This firmware was uploaded in parts and has no usable checksum. Upload it again as one file", {}

    url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": BUCKET_NAME, "Key": key},
        ExpiresIn=FIRMWARE_URL_TTL_SECONDS,
    )

    _publish({"event_type": "ota", "device_id": device_id, "version": version, "md5": md5, "url": url})
    logger.info("Sent firmware %s to %s", version, device_id)
    return "success", f"Firmware {version} sent to {device_id}", {"device_id": device_id, "version": version}


HANDLERS = {
    "triggerCapture": _trigger_capture,
    "listFirmware": _list_firmware,
    "updateFirmware": _update_firmware,
}


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    action = event.get("requestContext", {}).get("routeKey")
    if action not in HANDLERS:
        action = body.get("action", "triggerCapture")
    handler = HANDLERS.get(action)

    def respond(status, message, extra):
        _send_to_client(event, {"status": status, "action": action, "message": message, **extra})

    authorizer = event.get("requestContext", {}).get("authorizer") or {}
    if authorizer.get("role") not in STAFF_ROLES:
        respond("error", "Forbidden", {})
        return {"statusCode": 403}

    if not handler:
        respond("error", "Unknown action", {})
        return {"statusCode": 400}

    if action != "listFirmware" and not iot_data:
        respond("error", "IOT_ENDPOINT is not configured for this Lambda", {})
        return {"statusCode": 500}

    try:
        status, message, extra = handler(event, body)
    except Exception:
        logger.exception("Device command failed: %s", action)
        respond("error", "The device command could not be sent", {})
        return {"statusCode": 500}

    respond(status, message, extra)
    return {"statusCode": 200 if status == "success" else 400}
