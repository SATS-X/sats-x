#ifndef ATTENDANCE_SYSTEM_ESP32CAM_H
#define ATTENDANCE_SYSTEM_ESP32CAM_H

// WebSocket API Gateway endpoint
extern const char* ws_url;

void attendanceSystemInit();
void attendanceSystemUpdate();

#endif
