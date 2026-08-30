#include "buzzer.h"
#include "mqtt.h"
#include <ArduinoJson.h>
#include "current_time.h"

// Biến để theo dõi trạng thái
static unsigned long detectionStartTime = 0;
static bool isDetecting = false;
static bool hasTriggered = false;
static unsigned long lastBeepTime = 0;
static int beepCounter = 0;
static bool isBeeping = false;

const float DISTANCE_THRESHOLD = 40.0; // cm
const unsigned long DETECTION_DURATION = 3000; // 3 giây
const char* MQTT_TOPIC = "esp32/attendance-system";

void buzzerInit() {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
}

void buzzerBeep(int beepCount, int beepDuration, int beepInterval) {
    for (int i = 0; i < beepCount; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(beepDuration);
        digitalWrite(BUZZER_PIN, LOW);
        if (i < beepCount - 1) { // Không delay sau tiếng beep cuối
            delay(beepInterval);
        }
    }
}

void buzzerUpdate(float distance) {
    unsigned long currentTime = millis();

    // Check if the distance < 40cm
    if (distance < DISTANCE_THRESHOLD && distance > 0) {
        if (!isDetecting) {
            // Start detecting
            isDetecting = true;
            detectionStartTime = currentTime;
            Serial.println("Start detecting person...");
        } else {
            if (currentTime - detectionStartTime >= DETECTION_DURATION && !hasTriggered) {
                hasTriggered = true;
                Serial.println("Activate buzzer - person detected in 3 seconds!");
                buzzerBeep(2, 200, 150);
                StaticJsonDocument<400> jsonDoc;
                jsonDoc["day"] = getCurrentDay();
                jsonDoc["month"] = getCurrentMonth();
                jsonDoc["year"] = getCurrentYear();
                jsonDoc["hour"] = getCurrentHour();
                jsonDoc["minute"] = getCurrentMinute();
                jsonDoc["second"] = getCurrentSecond();
                jsonDoc["weekday"] = getCurrentWeekday();
                jsonDoc["formatted_datetime"] = getFormattedDateTime();
                jsonDoc["distance"] = distance;
                jsonDoc["event_type"] = "compare";

                char jsonString[400];
                serializeJson(jsonDoc, jsonString);

                // Publish message to attendance system topic
                if (isClientConnected()) {
                    publishMessage(MQTT_TOPIC, jsonString);
                    Serial.println("Send person detection message to esp32/attendance-system");
                } else {
                    Serial.println("Cannot send notification - MQTT not connected");
                }
            }
        }
    } else {
        // Reset state when no detection
        if (isDetecting) {
            isDetecting = false;
            hasTriggered = false;
            Serial.println("Stop detecting - person has left the area");
        }
    }
}

bool isBuzzerTriggered() {
    return hasTriggered;
}