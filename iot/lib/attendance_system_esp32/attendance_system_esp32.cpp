#include "attendance_system_esp32.h"
#include "distance.h"
#include "buzzer.h"
#include "led_indicator.h"
#include "wifi_connect.h"
#include "mqtt.h"
#include "current_time.h"

void attendanceSystemESP32Init() {
    Serial.begin(115200);
    Serial.println("\n=== Attendance System ESP32 Initialization ===");

    // Initialize distance sensor
    Serial.println("Initializing distance sensor...");
    distanceInit();

    // Initialize buzzer
    Serial.println("Initializing buzzer...");
    buzzerInit();

    // Initialize LED indicator
    Serial.println("Initializing LED indicator...");
    ledInit();

    // Connect to WiFi first
    wifiConnect();

    // Initialize time after WiFi connection
    Serial.println("Initializing time synchronization...");
    initTime();

    // Connect to AWS IoT Core
    Serial.println("Connecting to AWS IoT Core...");
    if (connectToAWSIoTCore_ESP32()) {
        Serial.println("Subscribing to MQTT topics...");
        const char* topics[] = {
            "esp32-cam/attendance-system"
        };
        int topicCount = sizeof(topics) / sizeof(topics[0]);

        if (subscribeMultipleTopics(topics, topicCount)) {
            Serial.println("All topics subscribed successfully!");
        } else {
            Serial.println("Some topics failed to subscribe!");
        }
    } else {
        Serial.println("AWS IoT connection failed!");
    }

    Serial.println("=== Initialization Complete ===\n");
}

void attendanceSystemESP32Update() {
    float currentDistance = getDistance();
    if (currentDistance > 0) {
        buzzerUpdate(currentDistance);
        ledUpdate(currentDistance);
    }

    // MQTT client loop
    clientLoop_ESP32();

    // Kiểm tra trạng thái MQTT và hiển thị thông tin định kỳ
    static unsigned long lastStatusCheck = 0;
    if (millis() - lastStatusCheck > 30000) {
        if (isClientConnected()) {
            Serial.println("=== System Status ===");
            Serial.println("MQTT Status: Connected");
            Serial.print("Current Distance: ");
            Serial.print(currentDistance);
            Serial.println(" cm");
            if (isBuzzerTriggered()) {
                Serial.println("Person Detection: TRIGGERED");
            } else {
                Serial.println("Person Detection: MONITORING");
            }
            Serial.print("LED Status: ");
            Serial.println(isLedActive() ? "ON" : "OFF");
            Serial.println("==================");
        } else {
            Serial.println("MQTT Status: Disconnected - Attempting reconnection...");
        }
        lastStatusCheck = millis();
    }

    // Delay nhỏ để tránh spam
    delay(100);
}