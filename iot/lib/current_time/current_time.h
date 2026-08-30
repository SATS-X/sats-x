#ifndef CURRENT_TIME_H
#define CURRENT_TIME_H

#include <Arduino.h>
#include <time.h>
#include <WiFi.h>

// Time configuration
extern const char* ntpServers[];
extern const int ntpServerCount;
extern const long gmtOffset_sec;
extern const int daylightOffset_sec;

// Time initialization and management
void initTime();
void retryTimeSync();
bool isTimeReady();

// Time getting functions
bool getCurrentTimeInfo(struct tm* timeinfo);
String getCurrentDateTimeString();
String getCurrentDateString();
String getCurrentTimeString();

// Individual time components
int getCurrentDay();
int getCurrentMonth();
int getCurrentYear();
int getCurrentHour();
int getCurrentMinute();
int getCurrentSecond();
int getCurrentWeekday();

// Formatted time strings
String getFormattedDateTime();
String getFormattedDate();
String getFormattedTime();

#endif