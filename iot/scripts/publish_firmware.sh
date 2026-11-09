#!/usr/bin/env bash
# Build the ESP32-CAM firmware and upload it as a release for over-the-air updates.
# Usage: scripts/publish_firmware.sh <s3-bucket-name>
set -euo pipefail

BUCKET="${1:?Usage: scripts/publish_firmware.sh <s3-bucket-name>}"
cd "$(dirname "$0")/.."

VERSION="$(sed -n 's/.*FIRMWARE_VERSION=\\"\([^\\]*\)\\".*/\1/p' platformio.ini | head -1)"
[ -n "$VERSION" ] || { echo "FIRMWARE_VERSION not found in platformio.ini" >&2; exit 1; }

pio run -e esp32cam
aws s3 cp .pio/build/esp32cam/firmware.bin "s3://$BUCKET/firmware/$VERSION.bin" --content-type application/octet-stream
echo "Published firmware $VERSION"
