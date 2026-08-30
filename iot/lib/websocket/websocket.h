#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include "display_manager.h"

using namespace websockets;

extern WebsocketsClient wsClient;
extern String deviceId;
extern String currentClassId;
extern String currentCollectionId;

void websocketInit();
void websocketConnect(const char* ws_url);
void websocketPoll();
void websocketSendUpload(const String& image_base64);
void websocketSendCompare(const String& image_base64);
void websocketSendSchedule();
void reconnectWebsocket();
JsonVariant findCurrentSchedule(JsonArray scheduleData);

// Helper functions to get/set class information
String getCurrentClassId();
String getCurrentCollectionId();
void setCurrentClassId(const String& classId);

// Auto-schedule control
void setAutoScheduleOnConnect(bool enable);
void requestScheduleUpdate();

#endif
