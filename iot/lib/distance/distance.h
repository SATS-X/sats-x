#ifndef DISTANCE_H
#define DISTANCE_H

#include <Arduino.h>

#define TRIG_PIN 5
#define ECHO_PIN 18

void distanceInit();
void distanceUpdate();
float getDistance();

#endif
