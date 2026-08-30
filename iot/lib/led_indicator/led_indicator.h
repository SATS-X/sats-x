#ifndef LED_INDICATOR_H
#define LED_INDICATOR_H

#include <Arduino.h>

#define LED_PIN 2  // Có thể thay đổi chân LED theo phần cứng của bạn
#define LED_CHANNEL 0  // PWM channel
#define LED_FREQUENCY 5000  // PWM frequency
#define LED_RESOLUTION 8  // PWM resolution (8-bit: 0-255)

// Độ sáng LED (0-255)
#define LED_BRIGHTNESS_LOW 1    // Độ sáng nhẹ (~1%)

void ledInit();
void ledOn();
void ledOff();
void ledSetBrightness(uint8_t brightness);
void ledBlink(int blinkCount, int blinkDuration = 200, int blinkInterval = 100);
void ledUpdate(float distance);
bool isLedActive();

#endif
