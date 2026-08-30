#ifndef BUZZER_H
#define BUZZER_H

#include <Arduino.h>

#define BUZZER_PIN 19

void buzzerInit();
void buzzerBeep(int beepCount, int beepDuration = 200, int beepInterval = 100);
void buzzerUpdate(float distance);
bool isBuzzerTriggered();

#endif