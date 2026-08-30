#include "wifi_connect.h"
#include "eeprom_manager.h"
#include "wifi_config_page.h"

// Web server và DNS server
WebServer server(80);
DNSServer dnsServer;

// Thông tin WiFi AP
const char* AP_SSID = "AttendanceSystem-Config";
const char* AP_PASSWORD = "";  // Không có mật khẩu

// Timeout cho WiFi connection
const unsigned long WIFI_TIMEOUT = 10000;  // 10 giây

// Biến lưu trữ thông tin WiFi
char savedSSID[SSID_SIZE];
char savedPassword[PASSWORD_SIZE];

// Load WiFi credentials từ EEPROM
bool loadWiFiCredentials() {
    if (!EEPROMManager::hasWiFiCredentials()) {
        Serial.println("No WiFi credentials found in EEPROM");
        return false;
    }

    if (!EEPROMManager::readWiFiSSID(savedSSID)) {
        Serial.println("Failed to read SSID from EEPROM");
        return false;
    }

    if (!EEPROMManager::readWiFiPassword(savedPassword)) {
        Serial.println("Failed to read password from EEPROM");
        return false;
    }

    Serial.println("WiFi credentials loaded from EEPROM");
    Serial.print("SSID: ");
    Serial.println(savedSSID);
    return true;
}

// Lưu WiFi credentials vào EEPROM
void saveWiFiCredentials(const char* ssid, const char* password) {
    Serial.println("Saving WiFi credentials to EEPROM...");

    EEPROMManager::writeWiFiSSID(ssid);
    EEPROMManager::writeWiFiPassword(password);
    EEPROMManager::commit();

    // Cập nhật biến local
    memset(savedSSID, 0, SSID_SIZE);
    memset(savedPassword, 0, PASSWORD_SIZE);
    strncpy(savedSSID, ssid, SSID_SIZE - 1);
    strncpy(savedPassword, password, PASSWORD_SIZE - 1);

    Serial.println("WiFi credentials saved successfully");
}

// Handler cho trang chủ
void handleRoot() {
    server.send(200, "text/html", WIFI_CONFIG_HTML);
}

// Handler để quét WiFi
void handleScanWifi() {
    Serial.println("Scanning WiFi networks...");
    int n = WiFi.scanNetworks();

    String json = "[";
    for (int i = 0; i < n; i++) {
        if (i > 0) json += ",";
        json += "\"" + WiFi.SSID(i) + "\"";
    }
    json += "]";

    server.send(200, "application/json", json);
    Serial.println("WiFi scan completed");
}

// Handler để lưu WiFi
void handleSaveWifi() {
    if (server.hasArg("ssid") && server.hasArg("pass")) {
        String ssid = server.arg("ssid");
        String password = server.arg("pass");

        Serial.println("Saving WiFi credentials...");
        Serial.print("SSID: ");
        Serial.println(ssid);

        saveWiFiCredentials(ssid.c_str(), password.c_str());

        // Chỉ lưu, không restart ngay
        server.send(200, "text/plain", "WiFi credentials saved");

        Serial.println("WiFi credentials saved. Waiting for connection check...");
    } else {
        server.send(400, "text/plain", "Missing parameters");
    }
}

// Handler để kiểm tra kết nối WiFi
void handleCheckConnection() {
    Serial.println("Checking WiFi connection...");

    // Đọc WiFi credentials từ EEPROM
    char ssid[SSID_SIZE];
    char password[PASSWORD_SIZE];

    EEPROMManager::readWiFiSSID(ssid);
    EEPROMManager::readWiFiPassword(password);

    // Chuyển sang Station mode và thử kết nối
    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(ssid, password);

    Serial.print("Attempting to connect to: ");
    Serial.println(ssid);

    // Đợi kết nối (tối đa 8 giây)
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 8000) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();

    // Kiểm tra kết quả
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi connected successfully!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());

        server.send(200, "application/json", "{\"connected\":true,\"ip\":\"" + WiFi.localIP().toString() + "\"}");
    } else {
        Serial.println("WiFi connection failed!");

        // Quay lại AP mode
        WiFi.mode(WIFI_AP);

        server.send(200, "application/json", "{\"connected\":false}");
    }
}

// Handler để restart
void handleRestart() {
    server.send(200, "text/plain", "Restarting device...");
    delay(1000);
    ESP.restart();
}

// Bắt đầu Config Portal
void startConfigPortal() {
    Serial.println("\n=== Starting WiFi Configuration Portal ===");

    // Tắt WiFi station mode
    WiFi.mode(WIFI_AP);

    // Khởi tạo Access Point
    WiFi.softAP(AP_SSID, AP_PASSWORD);

    IPAddress IP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(IP);
    Serial.print("AP SSID: ");
    Serial.println(AP_SSID);

    // Cấu hình DNS server để chuyển hướng tất cả các domain về IP của AP
    dnsServer.start(53, "*", IP);

    // Cấu hình các route
    server.on("/", handleRoot);
    server.on("/scanWifi", handleScanWifi);
    server.on("/saveWifi", handleSaveWifi);
    server.on("/checkConnection", handleCheckConnection);
    server.on("/reStart", handleRestart);

    // Bắt đầu web server
    server.begin();
    Serial.println("Web server started");
    Serial.println("Connect to WiFi: " + String(AP_SSID));
    Serial.println("Then open browser and go to: http://192.168.4.1");
    Serial.println("==========================================\n");

    // Vòng lặp xử lý requests
    while (true) {
        dnsServer.processNextRequest();
        server.handleClient();
        delay(10);
    }
}

// Kết nối WiFi
bool wifiConnect() {
    // Khởi tạo EEPROM
    if (!EEPROMManager::begin()) {
        Serial.println("EEPROM initialization failed!");
        return false;
    }

    // Thử load WiFi credentials từ EEPROM
    if (!loadWiFiCredentials()) {
        Serial.println("No saved WiFi credentials. Starting config portal...");
        startConfigPortal();
        return false;
    }

    // Thử kết nối với WiFi đã lưu
    Serial.println("Attempting to connect to saved WiFi...");
    Serial.print("SSID: ");
    Serial.println(savedSSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(savedSSID, savedPassword);

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");

        if (millis() - startTime > WIFI_TIMEOUT) {
            Serial.println("\nWiFi connection timeout!");
            Serial.println("Starting config portal...");
            startConfigPortal();
            return false;
        }
    }

    Serial.println("\nWiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    return true;
}
