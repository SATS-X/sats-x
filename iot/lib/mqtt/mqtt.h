#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "secrets_esp32.h"
#include "secrets_esp32-cam.h"

bool connectToAWSIoTCore_ESP32();
bool connectToAWSIoTCore_ESP32CAM();
void reconnect_ESP32();
void reconnect_ESP32CAM();

bool subscribeTopic(const char* topic);
bool subscribeMultipleTopics(const char* topics[], int topicCount);
void handleMessage(char* topic, byte* payload, unsigned int length);
void clientLoop_ESP32();
void clientLoop_ESP32CAM();
void publishMessage(const char* topic, const char* message);
bool isClientConnected();
void setTopicsForESP32CAM(const char* topics[], int topicCount);
void resubscribeTopicsESP32CAM();