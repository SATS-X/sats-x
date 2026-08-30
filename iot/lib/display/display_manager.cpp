#include "display_manager.h"

TFT_eSPI tft = TFT_eSPI();

bool tft_output(int16_t x, int16_t y, uint16_t w, uint16_t h, uint16_t* bitmap) {
  if (y >= tft.height()) return 0;
  tft.pushImage(x, y, w, h, bitmap);
  return 1;
}

void drawRoundedRect(int x, int y, int width, int height, int radius, uint16_t color, bool filled) {
  if (filled) {
    tft.fillRoundRect(x, y, width, height, radius, color);
  } else {
    tft.drawRoundRect(x, y, width, height, radius, color);
  }
}

void drawProgressBar(int x, int y, int width, int height, int progress, uint16_t color) {
  // Background
  tft.fillRoundRect(x, y, width, height, 3, COLOR_SECONDARY);

  // Progress fill
  int fillWidth = map(progress, 0, 100, 0, width - 4);
  if (fillWidth > 0) {
    tft.fillRoundRect(x + 2, y + 2, fillWidth, height - 4, 2, color);
  }

  // Border
  tft.drawRoundRect(x, y, width, height, 3, COLOR_BORDER);
}

void displayInit() {
  tft.begin();
  tft.setRotation(3); // Landscape mode: 320x240 for main interface
  tft.fillScreen(COLOR_BACKGROUND);
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setTextSize(1);

  TJpgDec.setJpgScale(2);
  TJpgDec.setSwapBytes(true);
  TJpgDec.setCallback(tft_output);

  displayStartupAnimation();
}

void displayStartupAnimation() {
  tft.setRotation(3); // 320x240
  tft.fillScreen(COLOR_BACKGROUND);

  // Logo area
  int centerX = 160;
  int centerY = 60;

  // Animated logo
  for (int i = 0; i < 50; i++) {
    int size = map(i, 0, 49, 5, 40);
    uint16_t alpha = map(i, 0, 49, 0, 255);

    tft.fillCircle(centerX, centerY, size, COLOR_PRIMARY);
    delay(20);

    if (i < 49) tft.fillCircle(centerX, centerY, size, COLOR_BACKGROUND);
  }

  // System title with typewriter effect
  String title = "ATTENDANCE SYSTEM";
  tft.setTextSize(2);
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  int titleX = centerX - (title.length() * 6);
  int titleY = centerY + 50;

  for (int i = 0; i < title.length(); i++) {
    tft.setCursor(titleX + i * 12, titleY);
    tft.print(title[i]);
    delay(80);
  }

  // Subtitle
  tft.setTextSize(1);
  tft.setTextColor(COLOR_TEXT_SECONDARY);
  String subtitle = "Face Recognition System";
  int subX = centerX - (subtitle.length() * 3);
  tft.setCursor(subX, titleY + 25);
  tft.print(subtitle);

  // Loading bar animation
  int barX = 60;
  int barY = centerY + 90;
  int barWidth = 200;
  int barHeight = 8;

  for (int progress = 0; progress <= 100; progress += 2) {
    drawProgressBar(barX, barY, barWidth, barHeight, progress, COLOR_PRIMARY);

    // Status text
    tft.fillRect(barX, barY + 15, barWidth, 10, COLOR_BACKGROUND);
    tft.setCursor(barX, barY + 15);
    tft.setTextColor(COLOR_TEXT_SECONDARY);

    if (progress < 30) tft.print("Loading camera module...");
    else if (progress < 60) tft.print("Initializing AI engine...");
    else if (progress < 90) tft.print("Connecting to database...");
    else tft.print("System ready!");

    delay(50);
  }

  delay(1000);
  displayMainInterface();
}

void displayMainInterface() {
  tft.setRotation(3); // 320x240 landscape
  tft.fillScreen(COLOR_BACKGROUND);

  // Header bar
  tft.fillRect(0, 0, 320, 25, COLOR_PRIMARY);
  tft.setTextSize(1);
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setCursor(5, 8);
  tft.print("ATTENDANCE SYSTEM");

  // System status
  tft.setCursor(250, 8);
  tft.print("ONLINE");

  // Divider line
  tft.drawFastHLine(0, 25, 320, COLOR_BORDER);

  // Left side - Camera area (keep existing camera position)
  drawRoundedRect(5, 30, 150, 180, 5, COLOR_BORDER);
  tft.setTextSize(1);
  tft.setTextColor(COLOR_TEXT_SECONDARY);
  tft.setCursor(10, 35);

  // Right side - Info panel
  drawRoundedRect(165, 30, 150, 180, 5, COLOR_BORDER);
  tft.setTextSize(2); // Make USER INFORMATION text larger
  tft.setCursor(170, 37);
  tft.print("USER INFO");

  // Info sections
  tft.setTextSize(1); // Reset to normal size for info
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setCursor(170, 60);
  tft.print("Name: Ready to scan");
  tft.setCursor(170, 75);
  tft.print("Student ID: ----------");
  tft.setCursor(170, 90);
  tft.print("Status: Waiting");
  tft.setCursor(170, 105);
  tft.print("Similarity: --");

  // Bottom status bar
  tft.fillRect(0, 215, 320, 25, COLOR_SECONDARY);
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setCursor(5, 223);
  tft.print("Ready for face detection");

  tft.setCursor(220, 223);
  tft.print("--/-- --:--");
}

void displayCameraFrame(const uint8_t* jpegData, size_t jpegLen) {
  tft.setRotation(0); // Portrait mode: 240x320 for camera (KEEP UNCHANGED)
  TJpgDec.setJpgScale(2);

  int offsetX = 40; // 40px from left (giữ nguyên)
  int offsetY = 180; // 180px from top (giữ nguyên)
  TJpgDec.drawJpg(offsetX, offsetY, jpegData, jpegLen);

  // Switch back to landscape for UI updates
  tft.setRotation(3);
}

void displayUserInfo(const String& name, const String& id, const String& status) {
  tft.setRotation(3); // Landscape for UI

  // Clear only user info area (not overlapping with schedule area)
  tft.fillRect(170, 50, 140, 70, COLOR_BACKGROUND);

  // Extract student ID from format "TranDaiVi-N22DCCI044" to "N22DCCI044"
  String studentId = id;
  int dashIndex = id.lastIndexOf('-');
  if (dashIndex != -1 && dashIndex < id.length() - 1) {
    studentId = id.substring(dashIndex + 1);
  }

  // Update info
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setTextSize(1);

  tft.setCursor(170, 60);
  tft.print("Name: " + name);

  tft.setCursor(170, 75);
  tft.print("Student ID: " + studentId);

  tft.setCursor(170, 90);
  uint16_t statusColor = COLOR_TEXT_PRIMARY;
  if (status == "SUCCESS") statusColor = COLOR_SUCCESS;
  else if (status == "FAILED") statusColor = COLOR_ERROR;
  else if (status == "ABSENT") statusColor = COLOR_ERROR;
  else if (status == "SCANNING") statusColor = COLOR_WARNING;
  else if (status == "PARTIAL") statusColor = COLOR_WARNING;

  tft.setTextColor(statusColor);
  tft.print("Status: " + status);

  tft.setCursor(170, 105);
  tft.setTextColor(COLOR_TEXT_SECONDARY);
  tft.print("Similarity: --");
}

void displayUserInfo(const String& name, const String& id, const String& status, const String& similarity) {
  tft.setRotation(3); // Landscape for UI

  // Clear only user info area (not overlapping with schedule area)
  tft.fillRect(170, 50, 140, 70, COLOR_BACKGROUND);

  // Extract student ID from format "TranDaiVi-N22DCCI044" to "N22DCCI044"
  String studentId = id;
  int dashIndex = id.lastIndexOf('-');
  if (dashIndex != -1 && dashIndex < id.length() - 1) {
    studentId = id.substring(dashIndex + 1);
  }

  // Update info
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setTextSize(1);

  tft.setCursor(170, 60);
  tft.print("Name: " + name);

  tft.setCursor(170, 75);
  tft.print("Student ID: " + studentId);

  tft.setCursor(170, 90);
  uint16_t statusColor = COLOR_TEXT_PRIMARY;
  if (status == "SUCCESS") statusColor = COLOR_SUCCESS;
  else if (status == "FAILED") statusColor = COLOR_ERROR;
  else if (status == "ABSENT") statusColor = COLOR_ERROR;
  else if (status == "SCANNING") statusColor = COLOR_WARNING;
  else if (status == "PARTIAL") statusColor = COLOR_WARNING;

  tft.setTextColor(statusColor);
  tft.print("Status: " + status);

  // Always display similarity field
  tft.setCursor(170, 105);
  if (similarity.length() > 0 && (status == "SUCCESS" || status == "PARTIAL" || status == "ABSENT")) {
    uint16_t simColor = COLOR_SUCCESS;
    if (status == "SUCCESS") simColor = COLOR_SUCCESS;
    else if (status == "PARTIAL") simColor = COLOR_WARNING;
    else if (status == "ABSENT") simColor = COLOR_ERROR;

    tft.setTextColor(simColor);
    tft.print("Similarity: " + similarity);
  } else {
    tft.setTextColor(COLOR_TEXT_SECONDARY);
    tft.print("Similarity: --");
  }
}

void displaySystemStatus(const String& time, int userCount, bool isOnline) {
  tft.setRotation(3); // Landscape for UI

  // Update header status
  tft.fillRect(240, 5, 75, 15, COLOR_PRIMARY);
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setTextSize(1);
  tft.setCursor(250, 8);
  tft.print(isOnline ? "ONLINE" : "OFFLINE");

  // Update time
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.fillRect(170, 95, 140, 10, COLOR_BACKGROUND);
  tft.setCursor(170, 100);
  tft.print("Time: " + time);

  // Update user count
  tft.setTextColor(COLOR_TEXT_SECONDARY);
  tft.fillRect(170, 115, 140, 10, COLOR_BACKGROUND);
  tft.setCursor(170, 120);
  tft.print("Today: " + String(userCount) + " users");

  // Update bottom status
  tft.fillRect(5, 218, 200, 15, COLOR_SECONDARY);
  tft.setCursor(5, 223);
  if (isOnline) {
    tft.print("System operational");
  } else {
    tft.setTextColor(COLOR_ERROR);
    tft.print("System offline");
  }
}

void displayScheduleInfo(const String& subjectCode, const String& teacherName, const String& timeStart, const String& room) {
  tft.setRotation(3); // Landscape for UI

  // Clear the schedule info area (below user info area)
  tft.fillRect(170, 125, 140, 80, COLOR_BACKGROUND);

  // Draw border for schedule section
  drawRoundedRect(170, 125, 140, 80, 3, COLOR_BORDER);

  // Title
  tft.setTextSize(1);
  tft.setTextColor(COLOR_PRIMARY);
  tft.setCursor(175, 130);
  tft.print("TODAY'S SCHEDULE");

  // Subject ID
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setCursor(175, 145);
  tft.print("Subject ID: " + subjectCode);

  // Teacher
  tft.setCursor(175, 160);
  tft.print("Teacher: " + teacherName);

  // Time Start (extract start time from "07:00:00 - 10:15:00" format)
  String startTime = timeStart;
  int dashIndex = timeStart.indexOf(" - ");
  if (dashIndex != -1) {
    startTime = timeStart.substring(0, dashIndex);
  }

  tft.setCursor(175, 175);
  tft.print("Time Start: " + startTime);

  // Room
  tft.setCursor(175, 190);
  tft.print("Room: " + room);
}

// Time functions are now handled by current_time module

void displayCurrentDateTime() {
  // Try to retry NTP sync if needed
  retryTimeSync();

  // Check if time is ready
  if (!isTimeReady()) {
    tft.setRotation(3);
    tft.fillRect(180, 218, 140, 20, COLOR_SECONDARY);
    tft.setTextColor(COLOR_ERROR);
    tft.setTextSize(1);
    tft.setCursor(185, 223);
    tft.print("Syncing Time...");
    return;
  }

  // Get formatted date time string from current_time module
  String timeStr = getFormattedDateTime();

  // Clear the time area and display new time
  tft.setRotation(3);
  tft.fillRect(180, 218, 140, 20, COLOR_SECONDARY);
  tft.setTextColor(COLOR_TEXT_PRIMARY);
  tft.setTextSize(1);
  tft.setCursor(185, 223);
  tft.print(timeStr);
}