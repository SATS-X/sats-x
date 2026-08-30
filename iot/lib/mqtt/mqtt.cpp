#include "mqtt.h"
#include "attendance_system.h"

WiFiClientSecure net;
PubSubClient AWSIoTClient(net);

// Topic management for ESP32-CAM auto-resubscribe
static const char* esp32cam_topics[10];  // Max 10 topics
static int esp32cam_topic_count = 0;

// Topic management functions
void setTopicsForESP32CAM(const char* topics[], int topicCount) {
    if (topicCount > 10) {
        Serial.println("Warning: Too many topics, limiting to 10");
        topicCount = 10;
    }

    esp32cam_topic_count = topicCount;
    for (int i = 0; i < topicCount; i++) {
        esp32cam_topics[i] = topics[i];
    }

    Serial.print("Stored ");
    Serial.print(esp32cam_topic_count);
    Serial.println(" topics for ESP32-CAM auto-resubscribe");
}

void resubscribeTopicsESP32CAM() {
    if (esp32cam_topic_count > 0 && AWSIoTClient.connected()) {
        Serial.println("Re-subscribing to ESP32-CAM topics after reconnection...");

        for (int i = 0; i < esp32cam_topic_count; i++) {
            if (subscribeTopic(esp32cam_topics[i])) {
                Serial.print("Re-subscribed to: ");
                Serial.println(esp32cam_topics[i]);
            } else {
                Serial.print("Failed to re-subscribe to: ");
                Serial.println(esp32cam_topics[i]);
            }
            delay(100); // Small delay between subscriptions
        }
    }
}

bool subscribeTopic(const char* topic) {
    if (!AWSIoTClient.connected()) {
        Serial.println("Cannot subscribe: MQTT client not connected");
        return false;
    }

    if (AWSIoTClient.subscribe(topic)) {
        Serial.print("Successfully subscribed to topic: ");
        Serial.println(topic);
        return true;
    } else {
        Serial.print("Failed to subscribe to topic: ");
        Serial.println(topic);
        return false;
    }
}

void publishMessage(const char* topic, const char* message) {
    if (AWSIoTClient.publish(topic, message)) {
        Serial.print("Message published to topic: ");
        Serial.println(topic);
    } else {
        Serial.print("Failed to publish message to topic: ");
        Serial.println(topic);
    }
}

void handleMessage(char* topic, byte* payload, unsigned int length) {
    Serial.println("\n=== Received MQTT Message ===");
    Serial.print("Topic: ");
    Serial.println(topic);
    Serial.print("Payload length: ");
    Serial.println(length);

    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';

    Serial.print("Message content: ");
    Serial.println(message);

    // Parse JSON message
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        Serial.println("=== End MQTT Message ===\n");
        return;
    }

    if (doc.containsKey("event_type")) {
        const char* eventType = doc["event_type"];
        Serial.print("Event type detected: ");
        Serial.println(eventType);
        if (strcmp(eventType, "compare") == 0) {
            Serial.println("Received COMPARE command from ESP32 - Starting face comparison...");
            attendanceSystemCompare();

        } else {
            Serial.print("Unknown event type: ");
            Serial.println(eventType);
        }
    } else {
        Serial.println("No event_type found in message");
    }

    Serial.println("=== End MQTT Message ===\n");
}

bool connectToAWSIoTCore_ESP32() {
    Serial.println("=== Connecting ESP32 to AWS IoT Core ===");

    net.setCACert(AWS_CERT_CA_ESP32);
    net.setCertificate(AWS_CERT_CRT_ESP32);
    net.setPrivateKey(AWS_CERT_PRIVATE_ESP32);

    AWSIoTClient.setServer(AWS_IOT_ENDPOINT_ESP32, 8883);
    AWSIoTClient.setCallback(handleMessage);

    Serial.println("Connecting ESP32 to AWS IOT...");
    Serial.print("Endpoint: ");
    Serial.println(AWS_IOT_ENDPOINT_ESP32);
    Serial.print("Thing Name: ");
    Serial.println(THINGNAME_ESP32);

    int retryCount = 0;
    while (!AWSIoTClient.connect(THINGNAME_ESP32) && retryCount < 30) {
        Serial.print(".");
        retryCount++;
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }

    if (!AWSIoTClient.connected()) {
        Serial.println("\nESP32 AWS IoT Connection Timeout!");
        Serial.print("Connection state: ");
        Serial.println(AWSIoTClient.state());
        return false;
    }

    Serial.println("\nESP32 connected to AWS IoT successfully!");
    AWSIoTClient.setKeepAlive(60);

    return true;
}

bool connectToAWSIoTCore_ESP32CAM() {
    Serial.println("=== Connecting ESP32-CAM to AWS IoT Core ===");
    net.setCACert(AWS_CERT_CA_ESP32_CAM);
    net.setCertificate(AWS_CERT_CRT_ESP32_CAM);
    net.setPrivateKey(AWS_CERT_PRIVATE_ESP32_CAM);

    AWSIoTClient.setServer(AWS_IOT_ENDPOINT_ESP32, 8883);
    AWSIoTClient.setCallback(handleMessage);

    Serial.println("Connecting ESP32-CAM to AWS IOT...");
    Serial.print("Endpoint: ");
    Serial.println(AWS_IOT_ENDPOINT_ESP32_CAM);
    Serial.print("Thing Name: ");
    Serial.println(THINGNAME_ESP32_CAM);

    int retryCount = 0;
    while (!AWSIoTClient.connect(THINGNAME_ESP32_CAM) && retryCount < 30) {
        Serial.print(".");
        retryCount++;
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }

    if (!AWSIoTClient.connected()) {
        Serial.println("\nESP32-CAM AWS IoT Connection Timeout!");
        Serial.print("Connection state: ");
        Serial.println(AWSIoTClient.state());
        return false;
    }

    Serial.println("\nESP32-CAM connected to AWS IoT successfully!");
    AWSIoTClient.setKeepAlive(60);

    return true;
}

void reconnect_ESP32() {
    while (!AWSIoTClient.connected()) {
        Serial.print("Attempting ESP32 MQTT connection...");
        if (AWSIoTClient.connect(THINGNAME_ESP32)) {
            Serial.println("ESP32 AWS IoT Connected!");
        } else {
            Serial.print("failed, rc=");
            Serial.print(AWSIoTClient.state());
            Serial.println(" try again in 5 seconds");
            vTaskDelay(5000 / portTICK_PERIOD_MS);
        }
    }
}

void reconnect_ESP32CAM() {
    while (!AWSIoTClient.connected()) {
        Serial.print("Attempting ESP32-CAM MQTT connection...");
        if (AWSIoTClient.connect(THINGNAME_ESP32_CAM)) {
            Serial.println("ESP32-CAM AWS IoT Connected!");

            // Auto-resubscribe to topics after successful reconnection
            resubscribeTopicsESP32CAM();

        } else {
            Serial.print("failed, rc=");
            Serial.print(AWSIoTClient.state());
            Serial.println(" try again in 5 seconds");
            vTaskDelay(5000 / portTICK_PERIOD_MS);
        }
    }
}

bool subscribeMultipleTopics(const char* topics[], int topicCount) {
    bool allSuccess = true;
    for (int i = 0; i < topicCount; i++) {
        if (!subscribeTopic(topics[i])) {
            allSuccess = false;
        }
        vTaskDelay(100 / portTICK_PERIOD_MS); // Small delay between subscriptions
    }
    return allSuccess;
}

bool isClientConnected() {
    return AWSIoTClient.connected();
}

void clientLoop_ESP32() {
    if (!AWSIoTClient.connected()) {
        Serial.println("ESP32 MQTT client disconnected, attempting reconnection...");
        reconnect_ESP32();
    }
    AWSIoTClient.loop();
}

void clientLoop_ESP32CAM() {
    if (!AWSIoTClient.connected()) {
        Serial.println("ESP32-CAM MQTT client disconnected, attempting reconnection...");
        reconnect_ESP32CAM();
    }
    AWSIoTClient.loop();
}