#include "eeprom_manager.h"

bool EEPROMManager::begin() {
    if (!EEPROM.begin(WIFI_EEPROM_SIZE)) {
        Serial.println("Failed to initialize EEPROM");
        return false;
    }
    Serial.println("EEPROM initialized successfully");
    return true;
}

bool EEPROMManager::isValidSSID(const char* ssid) {
    if (!ssid) return false;
    if (ssid[0] == 0 || ssid[0] == 0xFF) return false;
    return true;
}

bool EEPROMManager::writeWiFiSSID(const char* ssid) {
    if (!ssid) {
        Serial.println("Invalid SSID pointer");
        return false;
    }

    // Xóa vùng SSID
    for (uint8_t i = 0; i < SSID_SIZE; i++) {
        EEPROM.write(SSID_ADDR + i, 0);
    }

    // Ghi SSID mới
    size_t len = strlen(ssid);
    if (len >= SSID_SIZE) len = SSID_SIZE - 1;

    for (size_t i = 0; i < len; i++) {
        EEPROM.write(SSID_ADDR + i, ssid[i]);
    }

    Serial.println("WiFi SSID written to EEPROM");
    return true;
}

bool EEPROMManager::writeWiFiPassword(const char* password) {
    if (!password) {
        Serial.println("Invalid password pointer");
        return false;
    }

    // Xóa vùng password
    for (uint8_t i = 0; i < PASSWORD_SIZE; i++) {
        EEPROM.write(PASSWORD_ADDR + i, 0);
    }

    // Ghi password mới
    size_t len = strlen(password);
    if (len >= PASSWORD_SIZE) len = PASSWORD_SIZE - 1;

    for (size_t i = 0; i < len; i++) {
        EEPROM.write(PASSWORD_ADDR + i, password[i]);
    }

    Serial.println("WiFi password written to EEPROM");
    return true;
}

bool EEPROMManager::readWiFiSSID(char* ssid) {
    if (!ssid) {
        Serial.println("Invalid SSID buffer pointer");
        return false;
    }

    // Đọc SSID
    for (uint8_t i = 0; i < SSID_SIZE; i++) {
        ssid[i] = EEPROM.read(SSID_ADDR + i);
    }
    ssid[SSID_SIZE - 1] = '\0'; // Đảm bảo null-terminated

    return true;
}

bool EEPROMManager::readWiFiPassword(char* password) {
    if (!password) {
        Serial.println("Invalid password buffer pointer");
        return false;
    }

    // Đọc password
    for (uint8_t i = 0; i < PASSWORD_SIZE; i++) {
        password[i] = EEPROM.read(PASSWORD_ADDR + i);
    }
    password[PASSWORD_SIZE - 1] = '\0'; // Đảm bảo null-terminated

    return true;
}

bool EEPROMManager::hasWiFiCredentials() {
    char ssid[SSID_SIZE];
    readWiFiSSID(ssid);
    return isValidSSID(ssid);
}

void EEPROMManager::clearWiFiCredentials() {
    Serial.println("Clearing WiFi credentials from EEPROM...");

    // Xóa SSID
    for (uint8_t i = 0; i < SSID_SIZE; i++) {
        EEPROM.write(SSID_ADDR + i, 0);
    }

    // Xóa Password
    for (uint8_t i = 0; i < PASSWORD_SIZE; i++) {
        EEPROM.write(PASSWORD_ADDR + i, 0);
    }

    commit();
    Serial.println("WiFi credentials cleared");
}

void EEPROMManager::commit() {
    if (!EEPROM.commit()) {
        Serial.println("Failed to commit EEPROM changes");
    } else {
        Serial.println("EEPROM changes committed");
    }
}
