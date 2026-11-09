"""WebSocket connection lifecycle handler.

Open connections are stored so the attendance Lambda can push live events to
signed-in consoles. A storage failure only costs live updates, never the connection.
"""

import json
import logging
import os
import time

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

CONNECTIONS_TABLE = os.environ.get("CONNECTIONS_TABLE", "")
# API Gateway closes a WebSocket after 2 hours at most, so older rows are stale.
CONNECTION_TTL_SECONDS = 3 * 60 * 60

dynamodb = boto3.client("dynamodb")


def _remember_connection(connection_id, role):
    if not CONNECTIONS_TABLE:
        return
    try:
        dynamodb.put_item(
            TableName=CONNECTIONS_TABLE,
            Item={
                "connectionId": {"S": connection_id},
                "role": {"S": role or "unknown"},
                "expiresAt": {"N": str(int(time.time()) + CONNECTION_TTL_SECONDS)},
            },
        )
    except Exception:
        logger.exception("Could not store connection %s", connection_id)


def _forget_connection(connection_id):
    if not CONNECTIONS_TABLE:
        return
    try:
        dynamodb.delete_item(TableName=CONNECTIONS_TABLE, Key={"connectionId": {"S": connection_id}})
    except Exception:
        logger.exception("Could not remove connection %s", connection_id)


def lambda_handler(event, context):
    ctx = event.get("requestContext", {})
    route_key = ctx.get("routeKey")
    connection_id = ctx.get("connectionId")

    if route_key == "$connect":
        logger.info("Client connected: %s", connection_id)
        _remember_connection(connection_id, (ctx.get("authorizer") or {}).get("role"))
        return {"statusCode": 200, "body": "Connected"}

    if route_key == "$disconnect":
        logger.info("Client disconnected: %s", connection_id)
        _forget_connection(connection_id)
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
