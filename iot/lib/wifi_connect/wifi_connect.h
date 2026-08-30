#ifndef WIFI_CONNECT_H
#define WIFI_CONNECT_H

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>

// Function declarations
bool wifiConnect();
void startConfigPortal();
bool loadWiFiCredentials();
void saveWiFiCredentials(const char* ssid, const char* password);

#endif // WIFI_CONNECT_H
