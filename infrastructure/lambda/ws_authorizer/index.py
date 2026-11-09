"""REQUEST authorizer for the WebSocket $connect route.

Browsers cannot set headers on a WebSocket handshake, so every client presents
`?token=` instead:
  - console: a 60-second HS256 ticket from POST /api/auth/ws-ticket
  - ESP32-CAM: the shared device token stored in the firmware secrets

The role returned in `context` is what the route Lambdas check on each message.
"""

import base64
import binascii
import hashlib
import hmac
import json
import logging
import os
import time

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

WS_TICKET_SECRET = os.environ.get("WS_TICKET_SECRET", "")
WS_DEVICE_TOKEN = os.environ.get("WS_DEVICE_TOKEN", "")

TICKET_ISSUER = "attendance-system"
TICKET_AUDIENCE = "ws"
TICKET_ROLES = {"teacher", "admin"}


def _b64url_decode(value):
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _verify_ticket(token, secret, now):
    """Return the ticket's claims, or None if it is not valid right now."""
    if not secret:
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    try:
        header = json.loads(_b64url_decode(parts[0]))
        signature = _b64url_decode(parts[2])
        claims = json.loads(_b64url_decode(parts[1]))
    except (ValueError, binascii.Error):
        return None

    # Pinning the algorithm stops a forged header from selecting "none".
    if not isinstance(header, dict) or header.get("alg") != "HS256":
        return None

    expected = hmac.new(
        secret.encode("utf-8"),
        f"{parts[0]}.{parts[1]}".encode("ascii"),
        hashlib.sha256,
    ).digest()
    if not hmac.compare_digest(signature, expected):
        return None

    if not isinstance(claims, dict):
        return None

    expires_at = claims.get("exp")
    if (
        claims.get("iss") != TICKET_ISSUER
        or claims.get("aud") != TICKET_AUDIENCE
        or not isinstance(expires_at, (int, float))
        or expires_at <= now
        or claims.get("role") not in TICKET_ROLES
        or not claims.get("sub")
    ):
        return None

    return claims


def _is_device_token(token, device_token):
    return bool(device_token) and hmac.compare_digest(
        token.encode("utf-8"), device_token.encode("utf-8")
    )


def authenticate(token, ticket_secret, device_token, now):
    """Return (principal, role) for a valid token, otherwise None."""
    if not token:
        return None

    if _is_device_token(token, device_token):
        return "device", "device"

    try:
        claims = _verify_ticket(token, ticket_secret, now)
    except UnicodeEncodeError:
        return None

    if claims is None:
        return None
    return str(claims["sub"]), claims["role"]


def _policy(principal, effect, resource, context=None):
    response = {
        "principalId": principal,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": resource,
                }
            ],
        },
    }
    if context:
        response["context"] = context
    return response


def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    identity = authenticate(
        params.get("token", ""), WS_TICKET_SECRET, WS_DEVICE_TOKEN, time.time()
    )

    if identity is None:
        logger.warning("Rejected WebSocket connection")
        return _policy("unauthorized", "Deny", event["methodArn"])

    principal, role = identity
    logger.info("Authorized WebSocket connection: role=%s", role)
    return _policy(principal, "Allow", event["methodArn"], {"role": role})
