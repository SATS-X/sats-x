#include "attendance_system_esp32cam.h"
#include "camera_manager.h"
#include "display_manager.h"
#include "wifi_connect.h"
#include "websocket.h"
#include "mqtt.h"
#include "attendance_system.h"

// URL này lấy từ `terraform output websocket_url` (infrastructure) — đổi
// mỗi lần API Gateway được tạo lại (destroy/apply lại sẽ sinh API ID mới).
const char* ws_url = "wss://7i91rxj536.execute-api.ap-southeast-1.amazonaws.com/production";

void attendanceSystemInit() {
    displayInit();
    cameraInit();
    wifiConnect();
    initTime();
    websocketInit();
    websocketConnect(ws_url);
    Serial.println("Connecting to AWS IoT Core...");
    if (connectToAWSIoTCore_ESP32CAM()) {
        Serial.println("Subscribing to MQTT topics...");
        const char* topics[] = {
            "esp32/attendance-system",
        };
        int topicCount = sizeof(topics) / sizeof(topics[0]);

        // Store topics for auto-resubscribe on reconnection
        setTopicsForESP32CAM(topics, topicCount);

        if (subscribeMultipleTopics(topics, topicCount)) {
            Serial.println("All topics subscribed successfully!");
        } else {
            Serial.println("Some topics failed to subscribe!");
        }
    } else {
        Serial.println("AWS IoT connection failed!");
    }

    Serial.println("=== Initialization Complete ===");
    Serial.println("Waiting for WebSocket connection to auto-request schedule...\n");
    // Note: Schedule will be automatically requested when WebSocket connects
}

void attendanceSystemUpdate() {
    streamCamera();
    websocketPoll();

    // Auto-reconnect WebSocket if disconnected
    reconnectWebsocket();

    static unsigned long lastTimeUpdate = 0;
    if (millis() - lastTimeUpdate >= 1000) {
        displayCurrentDateTime();
        lastTimeUpdate = millis();
    }

    // Connection monitoring and status reporting
    static unsigned long lastConnectionCheck = 0;
    static bool wasConnected = true;
    if (millis() - lastConnectionCheck >= 10000) { // Check every 10 seconds
        bool isConnected = isClientConnected();

        if (!isConnected && wasConnected) {
            Serial.println("MQTT connection lost! Auto-reconnect will handle this...");
        } else if (isConnected && !wasConnected) {
            Serial.println("MQTT connection restored and topics re-subscribed!");
        }

        if (isConnected) {
            Serial.println("MQTT Status: Connected");
        } else {
            Serial.println("MQTT Status: Disconnected");
        }

        wasConnected = isConnected;
        lastConnectionCheck = millis();
    }

    if(Serial.available()) {
        String input = Serial.readStringUntil('\n');
        input.trim();
        if(input == "upload") {
            attendanceSystemUpload();
        }
        if(input == "compare") {
            attendanceSystemCompare();
        }
        if(input == "schedule") {
            attendanceSystemSchedule();
        }
    }

    // This will automatically reconnect and re-subscribe if disconnected
    clientLoop_ESP32CAM();
}