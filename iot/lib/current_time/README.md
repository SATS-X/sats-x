# Module Quản Lý Thời Gian (Current Time)

Module này cung cấp các hàm để đồng bộ và quản lý thời gian từ NTP servers cho hệ thống ESP32.

## Tính Năng

- **Đồng bộ NTP**: Tự động kết nối với nhiều NTP servers
- **Múi giờ Việt Nam**: GMT+7
- **Retry tự động**: Thử lại khi kết nối thất bại
- **Định dạng linh hoạt**: Nhiều format thời gian khác nhau
- **Thread-safe**: An toàn cho đa luồng

## Cấu Hình NTP Servers

```cpp
const char* ntpServers[] = {
  "time.google.com",
  "pool.ntp.org",
  "time.cloudflare.com",
  "time.nist.gov"
};
```

## Cách Sử Dụng

### 1. Khởi tạo

```cpp
#include "current_time.h"

void setup() {
    // Kết nối WiFi trước
    WiFi.begin(ssid, password);

    // Khởi tạo thời gian
    initTime();
}
```

### 2. Lấy thời gian chi tiết

```cpp
// Lấy từng thành phần
int day = getCurrentDay();        // 1-31
int month = getCurrentMonth();    // 1-12
int year = getCurrentYear();      // 2025
int hour = getCurrentHour();      // 0-23
int minute = getCurrentMinute();  // 0-59
int second = getCurrentSecond();  // 0-59
int weekday = getCurrentWeekday(); // 0=CN, 1=T2, ..., 6=T7
```

### 3. Lấy chuỗi định dạng

```cpp
// Định dạng khác nhau
String dateTime = getCurrentDateTimeString();  // "25/12/2025 14:30:25"
String date = getCurrentDateString();          // "25/12/2025"
String time = getCurrentTimeString();          // "14:30:25"

// Định dạng Việt Nam
String formatted = getFormattedDateTime();    // "T4 25/12/2025 14:30"
String formattedDate = getFormattedDate();    // "T4 25/12/2025"
String formattedTime = getFormattedTime();    // "14:30:25"
```

### 4. Kiểm tra trạng thái

```cpp
if (isTimeReady()) {
    Serial.println("Thời gian đã sẵn sàng");
} else {
    Serial.println("Đang đồng bộ thời gian...");
}
```

### 5. Retry thời gian

```cpp
void loop() {
    retryTimeSync(); // Tự động retry mỗi 5 phút nếu cần
    delay(1000);
}
```

## API Reference

### Khởi tạo & Quản lý
- `void initTime()` - Khởi tạo và đồng bộ thời gian
- `void retryTimeSync()` - Thử lại đồng bộ nếu cần
- `bool isTimeReady()` - Kiểm tra thời gian đã sẵn sàng

### Lấy thành phần thời gian
- `int getCurrentDay()` - Ngày (1-31)
- `int getCurrentMonth()` - Tháng (1-12)
- `int getCurrentYear()` - Năm (2025)
- `int getCurrentHour()` - Giờ (0-23)
- `int getCurrentMinute()` - Phút (0-59)
- `int getCurrentSecond()` - Giây (0-59)
- `int getCurrentWeekday()` - Thứ (0=CN, 1=T2, ..., 6=T7)

### Lấy chuỗi thời gian
- `String getCurrentDateTimeString()` - "25/12/2025 14:30:25"
- `String getCurrentDateString()` - "25/12/2025"
- `String getCurrentTimeString()` - "14:30:25"
- `String getFormattedDateTime()` - "T4 25/12/2025 14:30"
- `String getFormattedDate()` - "T4 25/12/2025"
- `String getFormattedTime()` - "14:30:25"

### Hàm nâng cao
- `bool getCurrentTimeInfo(struct tm* timeinfo)` - Lấy struct tm

## Ví Dụ Sử Dụng trong JSON

```cpp
StaticJsonDocument<400> jsonDoc;
jsonDoc["day"] = getCurrentDay();
jsonDoc["month"] = getCurrentMonth();
jsonDoc["year"] = getCurrentYear();
jsonDoc["hour"] = getCurrentHour();
jsonDoc["minute"] = getCurrentMinute();
jsonDoc["second"] = getCurrentSecond();
jsonDoc["formatted_datetime"] = getFormattedDateTime();
```

## Lưu Ý

- Cần kết nối WiFi trước khi gọi `initTime()`
- Module tự động retry mỗi 5 phút nếu đồng bộ thất bại
- Trả về -1 hoặc "Error" nếu thời gian chưa sẵn sàng
- Sử dụng múi giờ GMT+7 (Việt Nam)
