#include "distance.h"

static float lastDistance = 0.0;

void distanceInit() {
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
}

float getDistance() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000); // Timeout 30ms
    if (duration == 0) {
        return -1; // Timeout hoặc không có phản hồi
    }

    float distance = duration * 0.0343 / 2;

    // Lọc giá trị bất thường (quá gần hoặc quá xa)
    if (distance < 2.0 || distance > 400.0) {
        return lastDistance; // Trả về giá trị trước đó nếu đo không hợp lý
    }

    lastDistance = distance;
    return distance;
}

void distanceUpdate() {
    float distance = getDistance();
    if (distance > 0) {
        Serial.print("Khoang cach: ");
        Serial.print(distance);
        Serial.println(" cm");
    } else {
        Serial.println("Loi do khoang cach");
    }
}