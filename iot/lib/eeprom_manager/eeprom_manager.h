#ifndef EEPROM_MANAGER_H
#define EEPROM_MANAGER_H

#include <Arduino.h>
#include <EEPROM.h>

// Định nghĩa kích thước EEPROM cho WiFi
#define WIFI_EEPROM_SIZE 64

// Định nghĩa địa chỉ và kích thước WiFi credentials
#define SSID_ADDR 0
#define SSID_SIZE 32
#define PASSWORD_ADDR 32
#define PASSWORD_SIZE 32

class EEPROMManager {
public:
    // Khởi tạo EEPROM
    static bool begin();

    // Đọc/Ghi WiFi credentials
    static bool writeWiFiSSID(const char* ssid);
    static bool writeWiFiPassword(const char* password);
    static bool readWiFiSSID(char* ssid);
    static bool readWiFiPassword(char* password);

    // Kiểm tra WiFi credentials có tồn tại không
    static bool hasWiFiCredentials();

    // Xóa WiFi credentials
    static void clearWiFiCredentials();

    // Commit changes to EEPROM
    static void commit();

private:
    static bool isValidSSID(const char* ssid);
};

#endif // EEPROM_MANAGER_H
