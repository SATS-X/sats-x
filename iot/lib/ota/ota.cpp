#include "ota.h"

#include <HTTPClient.h>
#include <Update.h>
#include <WiFiClientSecure.h>

#include "aws_root_ca.h"

static String pendingUrl;
static String pendingMd5;
static String pendingVersion;

void otaRequest(const char* url, const char* md5, const char* version) {
    if (!url || !md5 || !version || strlen(md5) != 32) {
        Serial.println("OTA: ignored an incomplete command");
        return;
    }
    if (String(version) == FIRMWARE_VERSION) {
        Serial.println("OTA: already running this version");
        return;
    }
    pendingUrl = url;
    pendingMd5 = md5;
    pendingVersion = version;
}

static bool downloadAndInstall() {
    WiFiClientSecure client;
    client.setCACert(AWS_CERT_CA);

    HTTPClient http;
    if (!http.begin(client, pendingUrl)) {
        Serial.println("OTA: could not open the firmware URL");
        return false;
    }

    int status = http.GET();
    int size = http.getSize();
    if (status != HTTP_CODE_OK || size <= 0) {
        Serial.printf("OTA: download failed, HTTP %d\n", status);
        http.end();
        return false;
    }

    if (!Update.begin(size) || !Update.setMD5(pendingMd5.c_str())) {
        Serial.printf("OTA: could not start, %s\n", Update.errorString());
        http.end();
        return false;
    }

    size_t written = Update.writeStream(*http.getStreamPtr());
    bool finished = written == (size_t)size && Update.end();
    http.end();

    if (!finished) {
        Serial.printf("OTA: install failed, %s\n", Update.errorString());
        Update.abort();
    }
    return finished;
}

void otaLoop(void (*prepare)(const String& version)) {
    if (pendingUrl.isEmpty()) return;

    Serial.println("OTA: updating to " + pendingVersion);
    prepare(pendingVersion);

    bool installed = downloadAndInstall();
    Serial.println(installed ? "OTA: installed, restarting" : "OTA: failed, restarting on the current firmware");

    // Khởi động lại trong cả hai trường hợp để mở lại kết nối từ trạng thái sạch.
    // Bản cài dở không được kích hoạt nên thiết bị vẫn chạy firmware cũ.
    delay(500);
    ESP.restart();
}
