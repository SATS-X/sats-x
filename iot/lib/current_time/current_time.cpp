#include "current_time.h"

// NTP Server configuration
const char* ntpServers[] = {
  "time.google.com",
  "pool.ntp.org",
  "time.cloudflare.com",
  "time.nist.gov"
};
const int ntpServerCount = sizeof(ntpServers) / sizeof(ntpServers[0]);

const long gmtOffset_sec = 7 * 3600; // GMT+7 for Vietnam
const int daylightOffset_sec = 0;

// Private variables
static bool isTimeInitialized = false;
static unsigned long lastNtpAttempt = 0;
static const unsigned long ntpRetryInterval = 300000; // 5 minutes

void initTime() {
  Serial.println("Initializing time synchronization...");

  // Try each NTP server
  for (int serverIndex = 0; serverIndex < ntpServerCount; serverIndex++) {
    Serial.printf("Trying NTP server: %s\n", ntpServers[serverIndex]);

    // Configure time with current server
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServers[serverIndex]);

    struct tm timeinfo;
    int attempts = 0;

    // Wait for sync with current server
    while (!getLocalTime(&timeinfo) && attempts < 15) {
      delay(1000);
      attempts++;
      Serial.print(".");

      // Check if we got a valid time (year > 2020)
      if (timeinfo.tm_year > 120) { // tm_year is years since 1900
        break;
      }
    }

    // Check if we successfully got time
    if (getLocalTime(&timeinfo) && timeinfo.tm_year > 120) {
      Serial.printf("\nTime synchronized with %s!\n", ntpServers[serverIndex]);
      Serial.printf("Current time: %02d/%02d/%04d %02d:%02d:%02d\n",
                   timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900,
                   timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
      isTimeInitialized = true;
      lastNtpAttempt = millis();
      return;
    }

    Serial.printf("\nFailed to sync with %s, trying next server...\n", ntpServers[serverIndex]);
  }

  // If all servers failed
  Serial.println("\nFailed to synchronize time with all NTP servers!");
  Serial.println("System will continue with local time and retry later.");
  isTimeInitialized = false;
  lastNtpAttempt = millis();
}

void retryTimeSync() {
  if (!isTimeInitialized && (millis() - lastNtpAttempt > ntpRetryInterval)) {
    Serial.println("Retrying NTP synchronization...");
    initTime();
  }
}

bool isTimeReady() {
  struct tm timeinfo;
  return (getLocalTime(&timeinfo) && timeinfo.tm_year > 120);
}

bool getCurrentTimeInfo(struct tm* timeinfo) {
  if (!getLocalTime(timeinfo) || timeinfo->tm_year < 120) {
    return false;
  }
  return true;
}

String getCurrentDateTimeString() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return "Time Error";
  }

  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%02d/%02d/%04d %02d:%02d:%02d",
           timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900,
           timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  return String(buffer);
}

String getCurrentDateString() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return "Date Error";
  }

  char buffer[16];
  snprintf(buffer, sizeof(buffer), "%02d/%02d/%04d",
           timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);
  return String(buffer);
}

String getCurrentTimeString() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return "Time Error";
  }

  char buffer[16];
  snprintf(buffer, sizeof(buffer), "%02d:%02d:%02d",
           timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  return String(buffer);
}

int getCurrentDay() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_mday;
}

int getCurrentMonth() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_mon + 1; // tm_mon is 0-11, we want 1-12
}

int getCurrentYear() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_year + 1900; // tm_year is years since 1900
}

int getCurrentHour() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_hour;
}

int getCurrentMinute() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_min;
}

int getCurrentSecond() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_sec;
}

int getCurrentWeekday() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return -1;
  }
  return timeinfo.tm_wday; // 0 = Sunday, 1 = Monday, etc.
}

String getFormattedDateTime() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return "Time Error";
  }

  // Vietnamese day names
  const char* dayNames[] = {"CN", "T2", "T3", "T4", "T5", "T6", "T7"};

  // Format: "T2 25/12/2025 14:30"
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%s %02d/%02d/%04d %02d:%02d",
           dayNames[timeinfo.tm_wday],
           timeinfo.tm_mday,
           timeinfo.tm_mon + 1,
           timeinfo.tm_year + 1900,
           timeinfo.tm_hour,
           timeinfo.tm_min);
  return String(buffer);
}

String getFormattedDate() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return "Date Error";
  }

  // Vietnamese day names
  const char* dayNames[] = {"CN", "T2", "T3", "T4", "T5", "T6", "T7"};

  // Format: "T2 25/12/2025"
  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%s %02d/%02d/%04d",
           dayNames[timeinfo.tm_wday],
           timeinfo.tm_mday,
           timeinfo.tm_mon + 1,
           timeinfo.tm_year + 1900);
  return String(buffer);
}

String getFormattedTime() {
  struct tm timeinfo;
  if (!getCurrentTimeInfo(&timeinfo)) {
    return "Time Error";
  }

  // Format: "14:30:25"
  char buffer[12];
  snprintf(buffer, sizeof(buffer), "%02d:%02d:%02d",
           timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  return String(buffer);
}
