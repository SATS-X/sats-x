#include <Arduino.h>
#include "attendance_system_esp32cam.h"

void setup() {
  Serial.begin(115200);
  attendanceSystemInit();
}

void loop() {
  attendanceSystemUpdate();
}