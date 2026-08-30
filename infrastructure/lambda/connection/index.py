"""WebSocket connection lifecycle handler."""

import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def lambda_handler(event, context):
    ctx = event.get("requestContext", {})
    route_key = ctx.get("routeKey")
    connection_id = ctx.get("connectionId")

    if route_key == "$connect":
        logger.info("Client connected: %s", connection_id)
        return {"statusCode": 200, "body": "Connected"}

    if route_key == "$disconnect":
        logger.info("Client disconnected: %s", connection_id)
        return {"statusCode": 200, "body": "Disconnected"}

    if route_key == "ping":
        return {"statusCode": 200, "body": json.dumps({"status": "success", "action": "pong"})}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    action = body.get("action")
    logger.warning("Unknown action from %s: %r", connection_id, action)

    return {
        "statusCode": 400,
        "body": json.dumps({
            "status": "error",
            "message": (
                f"Unsupported action: {action!r}"
                if action
                else "Payload must include an 'action' field"
            ),
        }),
    }
