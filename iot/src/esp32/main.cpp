#include <Arduino.h>
#include "attendance_system_esp32.h"

void setup() {
  attendanceSystemESP32Init();
}

void loop() {
  attendanceSystemESP32Update();
}