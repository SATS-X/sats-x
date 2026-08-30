#include "led_indicator.h"

// Biến để theo dõi trạng thái LED
static unsigned long detectionStartTime = 0;
static bool isDetecting = false;
static bool hasBlinkTriggered = false;
static bool ledState = false;
static uint8_t currentBrightness = LED_BRIGHTNESS_LOW;

const float DISTANCE_THRESHOLD = 40.0; // cm
const unsigned long DETECTION_DURATION = 3000; // 3 giây
const unsigned long BLINK_DURATION = 1000; // Chớp nháy trong 1 giây
const unsigned long BLINK_INTERVAL = 100; // Chớp mỗi 100ms

void ledInit() {
    // Cấu hình PWM cho LED
    ledcSetup(LED_CHANNEL, LED_FREQUENCY, LED_RESOLUTION);
    ledcAttachPin(LED_PIN, LED_CHANNEL);
    ledcWrite(LED_CHANNEL, 0);
    ledState = false;
    Serial.println("LED initialized with PWM support");
}

void ledOn() {
    ledcWrite(LED_CHANNEL, currentBrightness);
    ledState = true;
}

void ledOff() {
    ledcWrite(LED_CHANNEL, 0);
    ledState = false;
}

void ledSetBrightness(uint8_t brightness) {
    currentBrightness = brightness;
    if (ledState) {
        ledcWrite(LED_CHANNEL, currentBrightness);
    }
}

void ledBlink(int blinkCount, int blinkDuration, int blinkInterval) {
    for (int i = 0; i < blinkCount; i++) {
        ledcWrite(LED_CHANNEL, currentBrightness);
        delay(blinkDuration);
        ledcWrite(LED_CHANNEL, 0);
        if (i < blinkCount - 1) {
            delay(blinkInterval);
        }
    }
}

void ledUpdate(float distance) {
    unsigned long currentTime = millis();

    // Kiểm tra nếu khoảng cách < 40cm
    if (distance < DISTANCE_THRESHOLD && distance > 0) {
        if (!isDetecting) {
            // Bắt đầu phát hiện - bật đèn
            isDetecting = true;
            detectionStartTime = currentTime;
            ledOn();
            Serial.println("LED: ON - Detecting person...");
        } else {
            // Đang trong quá trình phát hiện
            unsigned long detectionTime = currentTime - detectionStartTime;

            if (detectionTime >= DETECTION_DURATION && !hasBlinkTriggered) {
                // Đã đủ 3 giây - chớp nháy LED
                hasBlinkTriggered = true;
                Serial.println("LED: BLINKING - Person detected for 3 seconds!");

                // Chớp nháy 5 lần
                ledBlink(5, 100, 100);

                // Tắt LED sau khi chớp
                ledOff();
                Serial.println("LED: OFF - Capture triggered");
            } else if (!hasBlinkTriggered) {
                // Vẫn đang đếm thời gian - giữ đèn sáng
                if (!ledState) {
                    ledOn();
                }
            }
        }
    } else {
        // Reset trạng thái khi không phát hiện người
        if (isDetecting) {
            isDetecting = false;
            hasBlinkTriggered = false;
            ledOff();
            Serial.println("LED: OFF - Person left the area");
        }
    }
}

bool isLedActive() {
    return ledState;
}
