#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <TFT_eSPI.h>
#include <TJpg_Decoder.h>
#include "current_time.h"

// Color definitions
#define COLOR_BACKGROUND    TFT_BLACK
#define COLOR_PRIMARY       0x1E90FF  // DodgerBlue
#define COLOR_SECONDARY     0x1E90FF  // Dark blue-gray
#define COLOR_SUCCESS       0x27AE60  // Green
#define COLOR_WARNING       0xF39C12  // Orange
#define COLOR_ERROR         0xE74C3C  // Red
#define COLOR_TEXT_PRIMARY  TFT_WHITE
#define COLOR_TEXT_SECONDARY 0xBDC3C7 // Light gray
#define COLOR_BORDER        0x34495E  // Gray

void displayInit();
void displayStartupAnimation();
void displayMainInterface();
void displayCameraFrame(const uint8_t* jpegData, size_t jpegLen);
void displayUserInfo(const String& name, const String& id, const String& status);
void displayUserInfo(const String& name, const String& id, const String& status, const String& similarity);
void displayScheduleInfo(const String& subjectCode, const String& teacherName, const String& timeStart, const String& room);
void displaySystemStatus(const String& time, int userCount, bool isOnline);
void displayCurrentDateTime();
void drawProgressBar(int x, int y, int width, int height, int progress, uint16_t color);
void drawRoundedRect(int x, int y, int width, int height, int radius, uint16_t color, bool filled = false);
bool tft_output(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t* bitmap);

#endif