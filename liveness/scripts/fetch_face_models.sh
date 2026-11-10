#!/usr/bin/env bash
# Downloads the OpenCV Zoo face models used by app/faces.py and checks their sha256.
set -Eeuo pipefail

DEST="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/models/faces}"
BASE="https://github.com/opencv/opencv_zoo/raw/main/models"
mkdir -p "$DEST"

fetch() {
    local name="$1" path="$2" sum="$3" target="$DEST/$1"
    if [[ -f "$target" ]] && shasum -a 256 "$target" | grep -q "^$sum "; then
        return 0
    fi
    echo "Downloading $name..."
    curl --fail --location --silent --show-error --retry 3 -o "$target.part" "$BASE/$path/$name"
    if ! shasum -a 256 "$target.part" | grep -q "^$sum "; then
        rm -f "$target.part"
        echo "Checksum mismatch for $name" >&2
        exit 1
    fi
    mv "$target.part" "$target"
}

fetch face_detection_yunet_2023mar.onnx face_detection_yunet \
    8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4
fetch face_recognition_sface_2021dec.onnx face_recognition_sface \
    0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79
