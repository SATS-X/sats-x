"""Trigger Lambda: cho phép frontend ra lệnh chụp ảnh từ xa qua MQTT.

Tái dùng nguyên cơ chế cảm biến khoảng cách đã có sẵn trên firmware — ESP32-CAM
đã subscribe topic "esp32/attendance-system" và tự gọi attendanceSystemCompare()
khi thấy {"event_type": "compare"} (xem lib/mqtt/mqtt.cpp: handleMessage(),
lib/buzzer/buzzer.cpp: buzzerUpdate() publish cùng payload này khi có người
đứng gần). Publish đúng payload đó qua AWS IoT Core — KHÔNG cần đổi/nạp lại
firmware, vì code xử lý phía thiết bị đã tồn tại và đang chạy.
"""

import json
import logging
import os
from datetime import datetime, timezone, timedelta

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

VN_TZ = timezone(timedelta(hours=7))

IOT_ENDPOINT = os.environ.get("IOT_ENDPOINT", "")
CAPTURE_TOPIC = os.environ.get("CAPTURE_TOPIC", "esp32/attendance-system")

iot_data = boto3.client("iot-data", endpoint_url=f"https://{IOT_ENDPOINT}") if IOT_ENDPOINT else None


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


def lambda_handler(event, context):
    if not iot_data:
        _send_to_client(event, {
            "status": "error",
            "action": "triggerCapture",
            "message": "IOT_ENDPOINT is not configured for this Lambda",
        })
        return {"statusCode": 500}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    topic = body.get("topic", CAPTURE_TOPIC)
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

    try:
        iot_data.publish(topic=topic, qos=1, payload=json.dumps(payload))
        logger.info("Published capture command to topic %s", topic)
        _send_to_client(event, {
            "status": "success",
            "action": "triggerCapture",
            "message": f"Capture command sent to device (topic: {topic})",
            "topic": topic,
        })
        return {"statusCode": 200}
    except Exception as e:
        logger.exception("Failed to publish capture command")
        _send_to_client(event, {
            "status": "error",
            "action": "triggerCapture",
            "message": f"Failed to send command to device: {e}",
        })
        return {"statusCode": 500}
