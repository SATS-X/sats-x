#ifndef OTA_H
#define OTA_H

#include <Arduino.h>

// Ghi nhận lệnh cập nhật. Việc tải chạy trong vòng lặp chính, không chạy trong callback MQTT.
void otaRequest(const char* url, const char* md5, const char* version);

// prepare được gọi ngay trước khi tải, để nơi gọi giải phóng các kết nối đang mở.
void otaLoop(void (*prepare)(const String& version));

#endif
