"""Schedule Lambda: fetches today's schedule from backend API.

ESP32-CAM gọi route "schedule" gửi kèm {action, day, month, year} (không có
deviceId — xem websocketSendSchedule() trong firmware). Backend trả về đúng
định dạng firmware cần (schedule[]/metadata ở top-level), Lambda chỉ chuyển
tiếp nguyên trạng, không bọc thêm trong "data".
"""

import json
import logging
import os
import urllib.request
import urllib.error

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "")
BACKEND_SERVICE_TOKEN = os.environ.get("BACKEND_SERVICE_TOKEN", "")


def _get_apigw_client(event):
    domain = event["requestContext"]["domainName"]
    stage = event["requestContext"]["stage"]
    endpoint_url = f"https://{domain}/{stage}"
    return boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)


def _send_to_client(event, payload):
    connection_id = event["requestContext"]["connectionId"]
    client = _get_apigw_client(event)
    client.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(payload).encode("utf-8"),
    )


def _fetch_schedule(day, month, year):
    if not BACKEND_API_URL:
        return None, "BACKEND_API_URL not configured"

    url = f"{BACKEND_API_URL}/api/device/schedule?day={day}&month={month}&year={year}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {BACKEND_SERVICE_TOKEN}"},
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        logger.error("Backend returned HTTP %s: %s", e.code, body)
        return None, f"Backend error {e.code}: {body}"
    except urllib.error.URLError as e:
        logger.error("Failed to reach backend: %s", e)
        return None, str(e)


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    day = body.get("day")
    month = body.get("month")
    year = body.get("year")

    if not all([day, month, year]):
        _send_to_client(event, {"status": "error", "message": "Missing day/month/year"})
        return {"statusCode": 400}

    schedule_response, error = _fetch_schedule(day, month, year)

    if error:
        _send_to_client(event, {"status": "error", "message": error})
        return {"statusCode": 200}  # đã trả lời client qua WebSocket, không cần API GW retry

    # schedule_response đã đúng hình dạng { status, schedule, metadata, message }
    # firmware cần — chuyển thẳng, không bọc thêm.
    _send_to_client(event, schedule_response)
    return {"statusCode": 200}
