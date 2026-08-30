#include "attendance_system.h"
#include "camera_manager.h"
#include "display_manager.h"
#include "websocket.h"

void attendanceSystemUpload() {
    Serial.println("Capturing photo & uploading...");
    String image_base64 = capturePhotoAndEncodeBase64();
    websocketSendUpload(image_base64);
}

void attendanceSystemCompare() {
    Serial.println("Capturing photo & comparing faces...");
    displayUserInfo("Scanning...", "Processing", "SCANNING");
    String image_base64 = capturePhotoAndEncodeBase64();
    websocketSendCompare(image_base64);
}

void attendanceSystemSchedule() {
    Serial.println("Scheduling attendance...");
    websocketSendSchedule();
}