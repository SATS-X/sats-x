#include "websocket.h"
#include <time.h>
#include "aws_root_ca.h"

WebsocketsClient wsClient;
String deviceId = "ESP32CAM_01";

// Reconnection variables
String wsUrl = "";
bool isReconnecting = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000; // 5 seconds
int reconnectAttempts = 0;
const int maxReconnectAttempts = 10;

// Current class information
String currentClassId = "";  // Stores the current class ID (e.g., "D22CQCI01-N")
String currentCollectionId = ""; // Dynamic collection based on class_id

// Auto-schedule on connection
bool autoScheduleOnConnect = true;  // Enable auto-schedule when WebSocket connects
bool scheduleRequested = false;     // Track if schedule has been requested

JsonVariant findCurrentSchedule(JsonArray scheduleData) {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to get current time for schedule comparison");
        return JsonVariant();
    }

    int currentHour = timeinfo.tm_hour;
    int currentMinute = timeinfo.tm_min;
    int currentTimeInMinutes = currentHour * 60 + currentMinute;

    Serial.printf("Current time: %02d:%02d (%d minutes from midnight)\n",
                  currentHour, currentMinute, currentTimeInMinutes);

    JsonVariant bestMatch;
    int bestMatchStartTime = -1;

    for (JsonVariant item : scheduleData) {
        // New data format: JSON object with fields: subject_code, subject_name, teacher_name, room, start_time, end_time, time_slot, day_name
        String timeSlot = item["time_slot"];
        String subjectCode = item["subject_code"];

        // Extract start and end times from "07:00:00 - 10:15:00" format
        int dashIndex = timeSlot.indexOf(" - ");
        if (dashIndex == -1) continue;

        String startTimeStr = timeSlot.substring(0, dashIndex);
        String endTimeStr = timeSlot.substring(dashIndex + 3);

        // Parse start time (format: "HH:MM:SS")
        int startHour = startTimeStr.substring(0, 2).toInt();
        int startMinute = startTimeStr.substring(3, 5).toInt();
        int startTimeInMinutes = startHour * 60 + startMinute;

        // Parse end time (format: "HH:MM:SS")
        int endHour = endTimeStr.substring(0, 2).toInt();
        int endMinute = endTimeStr.substring(3, 5).toInt();
        int endTimeInMinutes = endHour * 60 + endMinute;

        Serial.printf("Subject %s: %02d:%02d - %02d:%02d (%d - %d minutes)\n",
                      subjectCode.c_str(), startHour, startMinute, endHour, endMinute,
                      startTimeInMinutes, endTimeInMinutes);

        // Check if current time is within the class duration (between start and end time)
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
            // If this is a better match (closer to current time), use it
            if (bestMatchStartTime == -1 || startTimeInMinutes > bestMatchStartTime) {
                bestMatch = item;
                bestMatchStartTime = startTimeInMinutes;
                Serial.printf("New best match: %s (current time %d is within %d-%d minutes)\n",
                              subjectCode.c_str(), currentTimeInMinutes, startTimeInMinutes, endTimeInMinutes);
            }
        }
    }

    if (!bestMatch.isNull()) {
        String selectedSubject = bestMatch["subject_code"];
        Serial.printf("Selected active schedule: %s\n", selectedSubject.c_str());
    } else {
        Serial.println("No schedule matches current time");
    }

    return bestMatch;
}

void websocketInit() {
    wsClient.onEvent([](WebsocketsEvent event, String data){
        if(event == WebsocketsEvent::ConnectionOpened) {
            Serial.println("WebSocket Connected!");
            isReconnecting = false;
            reconnectAttempts = 0;

            // Auto-request schedule on connection
            if (autoScheduleOnConnect && !scheduleRequested) {
                Serial.println("Auto-requesting schedule on connection...");
                delay(500); // Small delay to ensure connection is stable
                websocketSendSchedule();
                scheduleRequested = true;
            }
        } else if(event == WebsocketsEvent::ConnectionClosed) {
            Serial.println("WebSocket Disconnected!");
            scheduleRequested = false; // Reset so schedule will be requested again on reconnect
            if (!isReconnecting) {
                Serial.println("Starting reconnection process...");
                isReconnecting = true;
                lastReconnectAttempt = 0; // Allow immediate first retry
            }
        }
    });

    wsClient.onMessage([](WebsocketsMessage msg){
        Serial.println("Server: " + msg.data());

        DynamicJsonDocument doc(8192);
        DeserializationError error = deserializeJson(doc, msg.data());

        if (!error) {
            String status = doc["status"];

            if (status == "success") {
                // Check if this is a face attendance result (has attendance_result field)
                if (doc.containsKey("attendance_result")) {
                    JsonObject faceResult = doc["face_compare_result"];
                    JsonObject attendanceResult = doc["attendance_result"];
                    JsonObject classInfo = attendanceResult["class_info"];
                    JsonObject attendanceInfo = attendanceResult["attendance_result"];

                    if (faceResult["match_found"]) {
                        String studentId = faceResult["student_id"];
                        String externalId = faceResult["external_id"];
                        float similarity = faceResult["similarity"];
                        String attendanceStatus = attendanceInfo["status"];
                        String subject = classInfo["subject"];
                        String room = classInfo["room"];
                        String startTime = classInfo["start_time"];
                        String endTime = classInfo["end_time"];

                        // Format similarity as percentage
                        String similarityStr = String(similarity, 1) + "%";

                        // Extract student name from external_id (format: "TranDaiVi-N22DCCI044")
                        String studentName = externalId;
                        int dashIndex = externalId.indexOf("-");
                        if (dashIndex != -1) {
                            studentName = externalId.substring(0, dashIndex);
                        }

                        // Display user information with attendance status
                        displayUserInfo(studentName, studentId, "SUCCESS", similarityStr);

                        Serial.println("=== FACE ATTENDANCE SUCCESS ===");
                        Serial.println("Student ID: " + studentId);
                        Serial.println("Similarity: " + similarityStr);
                        Serial.println("Attendance Status: " + attendanceStatus);
                        Serial.println("Subject: " + subject);
                        Serial.println("Room: " + room);
                        Serial.println("Class Time: " + startTime + " - " + endTime);
                        Serial.println("Message: " + attendanceInfo["message"].as<String>());
                        Serial.println("=== END ATTENDANCE INFO ===");
                    } else {
                        // No match found
                        displayUserInfo("Unknown", "No Match", "FAILED");
                        Serial.println("No face match found for attendance");
                    }
                }
                // Check if this is a legacy face compare result (for backward compatibility)
                else if (doc.containsKey("face_compare_result")) {
                    JsonObject faceResult = doc["face_compare_result"];

                    if (faceResult["match_found"]) {
                        String userName = faceResult["user_name"];
                        float similarity = faceResult["similarity"];
                        String externalId = faceResult["external_id"];

                        // Format similarity as percentage
                        String similarityStr = String(similarity, 1) + "%";

                        // Display user information with similarity
                        displayUserInfo(userName, externalId, "SUCCESS", similarityStr);

                        Serial.println("Face match found!");
                        Serial.println("User: " + userName);
                        Serial.println("Similarity: " + similarityStr);
                        Serial.println("ID: " + externalId);
                    } else {
                        // No match found
                        displayUserInfo("Unknown", "No Match", "FAILED");
                        Serial.println("No face match found");
                    }
                }
            } else if (status == "partial_success") {
                // Face recognition successful but attendance failed
                if (doc.containsKey("face_compare_result")) {
                    JsonObject faceResult = doc["face_compare_result"];

                    if (faceResult["match_found"]) {
                        String studentId = faceResult["student_id"];
                        String externalId = faceResult["external_id"];
                        float similarity = faceResult["similarity"];
                        String attendanceMessage = doc["attendance_result"]["message"];
                        String attendanceReason = doc["attendance_result"]["reason"];

                        // Format similarity as percentage
                        String similarityStr = String(similarity, 1) + "%";

                        // Extract student name from external_id (format: "TranDaiVi-N22DCCI044")
                        String studentName = externalId;
                        int dashIndex = externalId.indexOf("-");
                        if (dashIndex != -1) {
                            studentName = externalId.substring(0, dashIndex);
                        }

                        // Determine display status based on attendance reason
                        String displayStatus = "PARTIAL";
                        if (attendanceReason == "ATTENDANCE_PERIOD_EXPIRED") {
                            displayStatus = "ABSENT";
                        }

                        // Display user information with appropriate status
                        displayUserInfo(studentName, studentId, displayStatus, similarityStr);

                        Serial.println("=== FACE RECOGNITION SUCCESS (PARTIAL) ===");
                        Serial.println("Student ID: " + studentId);
                        Serial.println("Similarity: " + similarityStr);
                        Serial.println("Attendance Status: Failed");
                        Serial.println("Reason: " + attendanceMessage);
                        Serial.println("Display Status: " + displayStatus);
                        Serial.println("=== END PARTIAL SUCCESS INFO ===");
                    } else {
                        // No match found
                        displayUserInfo("Unknown", "No Match", "FAILED");
                        Serial.println("No face match found");
                    }
                } else {
                    // Fallback for other partial success cases
                    displayUserInfo("Upload OK", "Compare Failed", "FAILED");
                    Serial.println("Upload successful but face comparison failed");
                }
            } else if (status == "error") {
                // Handle error response
                displayUserInfo("Error", "System Error", "FAILED");
                Serial.println("Error from server: " + doc["message"].as<String>());
            }

            // Check if this is a schedule response
            if (doc.containsKey("schedule")) {
                if (status == "success") {
                    JsonArray scheduleData = doc["schedule"];
                    JsonObject metadata = doc["metadata"];
                    JsonObject currentScheduleObj = doc["current_schedule"];

                    Serial.println("=== SCHEDULE DATA RECEIVED ===");
                    Serial.println("Message: " + doc["message"].as<String>());
                    Serial.printf("Total classes: %d\n", metadata["total_classes"].as<int>());
                    Serial.printf("Date: %d/%d/%d\n",
                                  metadata["day"].as<int>(),
                                  metadata["month"].as<int>(),
                                  metadata["year"].as<int>());
                    Serial.println("Timezone: " + metadata["timezone"].as<String>());
                    Serial.println("");
                    Serial.println("Schedule Details:");

                    for (JsonVariant item : scheduleData) {
                        // New data format: JSON object with fields
                        String subjectCode = item["subject_code"];
                        String subjectName = item["subject_name"];
                        String teacherName = item["teacher_name"];
                        String className = item["class_name"];
                        String classId = item["class_id"];
                        String room = item["room"];
                        String startTime = item["start_time"];
                        String endTime = item["end_time"];
                        String timeSlot = item["time_slot"];
                        String dayName = item["day_name"];

                        Serial.println("---");
                        Serial.println("Subject: " + subjectCode + " - " + subjectName);
                        Serial.println("Teacher: " + teacherName);
                        Serial.println("Class: " + className + " (" + classId + ")");
                        Serial.println("Room: " + room);
                        Serial.println("Time: " + timeSlot);
                        Serial.println("Day: " + dayName);
                    }
                    Serial.println("=== END SCHEDULE DATA ===");

                    // Always use local logic to determine current schedule instead of server's current_schedule
                    // This ensures accurate time-based selection regardless of server's determination
                    if (scheduleData.size() > 0) {
                        // Find and display the appropriate schedule based on current time
                        JsonVariant currentSchedule = findCurrentSchedule(scheduleData);

                        if (!currentSchedule.isNull()) {
                            String subjectCode = currentSchedule["subject_code"];
                            String subjectName = currentSchedule["subject_name"];
                            String teacherName = currentSchedule["teacher_name"];
                            String className = currentSchedule["class_name"];
                            String timeSlot = currentSchedule["time_slot"];
                            String room = currentSchedule["room"];
                            String dayName = currentSchedule["day_name"];

                            // Update current class information
                            if (currentSchedule.containsKey("class_id")) {
                                currentClassId = currentSchedule["class_id"].as<String>();
                                currentCollectionId = "attendance-system-" + currentClassId;

                                Serial.println("");
                                Serial.println("=== CLASS INFORMATION UPDATED ===");
                                Serial.println("Class Name: " + className);
                                Serial.println("Class ID: " + currentClassId);
                                Serial.println("Collection ID: " + currentCollectionId);
                                Serial.println("=================================");
                            } else {
                                Serial.println("");
                                Serial.println("ERROR: No class_id in schedule!");
                                Serial.println("Attendance will not work without class_id.");
                            }

                            displayScheduleInfo(subjectCode, teacherName, timeSlot, room);
                            Serial.println("");
                            Serial.println("=== CURRENT ACTIVE SCHEDULE ===");
                            Serial.println("Subject: " + subjectCode + " - " + subjectName);
                            Serial.println("Teacher: " + teacherName);
                            Serial.println("Class: " + className);
                            Serial.println("Room: " + room);
                            Serial.println("Time: " + timeSlot);
                            Serial.println("Day: " + dayName);
                            Serial.println("================================");
                        } else {
                            Serial.println("No active schedule found for current time");
                            // Display first schedule as fallback
                            JsonVariant firstItem = scheduleData[0];
                            String subjectCode = firstItem["subject_code"];
                            String subjectName = firstItem["subject_name"];
                            String teacherName = firstItem["teacher_name"];
                            String className = firstItem["class_name"];
                            String timeSlot = firstItem["time_slot"];
                            String room = firstItem["room"];
                            String dayName = firstItem["day_name"];

                            // Update current class information from first schedule
                            if (firstItem.containsKey("class_id")) {
                                currentClassId = firstItem["class_id"].as<String>();
                                currentCollectionId = "attendance-system-" + currentClassId;

                                Serial.println("");
                                Serial.println("=== CLASS INFORMATION UPDATED (FALLBACK) ===");
                                Serial.println("Class Name: " + className);
                                Serial.println("Class ID: " + currentClassId);
                                Serial.println("Collection ID: " + currentCollectionId);
                                Serial.println("============================================");
                            } else {
                                Serial.println("");
                                Serial.println("ERROR: No class_id in schedule!");
                                Serial.println("Attendance will not work without class_id.");
                            }

                            displayScheduleInfo(subjectCode, teacherName, timeSlot, room);
                        }
                    }
                } else {
                    Serial.println("Schedule request failed: " + doc["message"].as<String>());
                }
            }
        } else {
            Serial.println("Failed to parse JSON response");
        }
    });

    wsClient.setCACert(AWS_CERT_CA);
}

void websocketConnect(const char* ws_url) {
    Serial.println("Connecting to WebSocket API Gateway...");
    wsUrl = String(ws_url); // Store URL for reconnection
    reconnectAttempts = 0;  // Reset reconnect attempts
    wsClient.connect(ws_url);
}

void reconnectWebsocket() {
    if (wsClient.available() && wsClient.ping()) {
        isReconnecting = false;
        reconnectAttempts = 0;
        return;
    }

    if (isReconnecting && (millis() - lastReconnectAttempt < reconnectInterval)) {
        return; // Too soon to retry
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
        Serial.println("Max reconnection attempts reached. Stopping reconnection.");
        isReconnecting = false;
        return;
    }

    if (wsUrl.length() == 0) {
        Serial.println("No WebSocket URL stored for reconnection");
        return;
    }

    Serial.printf("WebSocket reconnection attempt %d/%d...\n", reconnectAttempts + 1, maxReconnectAttempts);

    wsClient.close();
    delay(100);

    bool connected = wsClient.connect(wsUrl.c_str());

    if (connected) {
        Serial.println("WebSocket reconnected successfully!");
        isReconnecting = false;
        reconnectAttempts = 0;
    } else {
        Serial.println("WebSocket reconnection failed");
        isReconnecting = true;
        reconnectAttempts++;
        lastReconnectAttempt = millis();
    }
}

void websocketPoll() {
    wsClient.poll();
}

// API Gateway đóng thẳng kết nối (close code 1009) khi nhận một frame > 32KB,
// và thư viện websocket ở đây gửi mỗi lần send() thành đúng một frame, không tự
// chia nhỏ. Ảnh QVGA chất lượng cao nằm sát ngưỡng này, nên vượt là mất kết nối
// giữa chừng mà không có lỗi nào nhìn thấy được — kiểm tra trước khi gửi để còn
// biết đường hạ chất lượng ảnh.
static const size_t WS_MAX_FRAME_BYTES = 32000;

static bool websocketPayloadFits(const String& payload) {
    if (payload.length() <= WS_MAX_FRAME_BYTES) return true;

    Serial.println("===========================================");
    Serial.printf("ERROR: Payload %u bytes > gioi han %u bytes/frame cua API Gateway\n",
                  (unsigned)payload.length(), (unsigned)WS_MAX_FRAME_BYTES);
    Serial.println("Gui di se bi dong ket noi (code 1009), anh khong toi duoc Lambda.");
    Serial.println("Cach xu ly: tang config.jpeg_quality (so lon hon = nen manh hon)");
    Serial.println("hoac ha frame_size trong cameraInit().");
    Serial.println("===========================================");
    displayUserInfo("Image too big", "Lower quality", "FAILED");
    return false;
}

void websocketSendUpload(const String& image_base64) {
    if(image_base64.length() > 0) {
        DynamicJsonDocument doc(200000);
        doc["action"] = "upload";
        doc["deviceId"] = deviceId;
        doc["image"] = image_base64;
        // Lambda dựng S3 key theo class_id (history/<class_id>/<ngày>/...) và từ
        // chối request thiếu field này — trước đây upload luôn bị trả về lỗi
        // "Missing image or classId".
        doc["class_id"] = currentClassId;
        String payload;
        serializeJson(doc, payload);
        if (!websocketPayloadFits(payload)) return;
        wsClient.send(payload);
        Serial.println("Upload sent!");
    } else {
        Serial.println("Error: Camera/photo encoding failed");
    }
}

void websocketSendCompare(const String& image_base64) {
    if(image_base64.length() > 0) {
        // Check if class_id is available
        if (currentClassId.isEmpty() || currentCollectionId.isEmpty()) {
            Serial.println("===========================================");
            Serial.println("ERROR: Cannot perform attendance!");
            Serial.println("Reason: No class information available");
            Serial.println("Solution: Request schedule first using websocketSendSchedule()");
            Serial.println("===========================================");
            displayUserInfo("No Class", "Get Schedule", "FAILED");
            return;
        }

        DynamicJsonDocument doc(200000);
        doc["action"] = "compare";
        doc["deviceId"] = deviceId;
        doc["image"] = image_base64;

        // Use dynamic collection_id based on current class
        doc["collection_id"] = currentCollectionId;
        doc["class_id"] = currentClassId;

        // Get current date and time from NTP server
        struct tm timeinfo;
        if (getLocalTime(&timeinfo)) {
            doc["day"] = timeinfo.tm_mday;
            doc["month"] = timeinfo.tm_mon + 1; // tm_mon is 0-based, so add 1
            doc["year"] = timeinfo.tm_year + 1900; // tm_year is years since 1900

            // Format time as HH:MM
            char timeStr[6];
            snprintf(timeStr, sizeof(timeStr), "%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
            doc["time"] = String(timeStr);

            Serial.printf("Face attendance request - Date: %d/%d/%d, Time: %s\n",
                          timeinfo.tm_mday,
                          timeinfo.tm_mon + 1,
                          timeinfo.tm_year + 1900,
                          timeStr);
        } else {
            Serial.println("Failed to get time from NTP server, using default values");
            doc["day"] = 1;
            doc["month"] = 1;
            doc["year"] = 2025;
            doc["time"] = "00:00";
        }

        Serial.println("=== ATTENDANCE REQUEST ===");
        Serial.println("Collection ID: " + currentCollectionId);
        Serial.println("Class ID: " + currentClassId);
        Serial.println("==========================");

        String payload;
        serializeJson(doc, payload);
        Serial.printf("Face attendance payload prepared (%u bytes)\n", (unsigned)payload.length());
        if (!websocketPayloadFits(payload)) return;
        wsClient.send(payload);
        Serial.println("Face attendance request sent!");
    } else {
        Serial.println("Error: Camera/photo encoding failed for face attendance");
    }
}

void websocketSendSchedule() {
    DynamicJsonDocument doc(1024);
    doc["action"] = "schedule";

    // Get current date from NTP server
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        doc["day"] = timeinfo.tm_mday;
        doc["month"] = timeinfo.tm_mon + 1; // tm_mon is 0-based, so add 1
        doc["year"] = timeinfo.tm_year + 1900; // tm_year is years since 1900

        Serial.printf("Current date: %d/%d/%d\n",
                      timeinfo.tm_mday,
                      timeinfo.tm_mon + 1,
                      timeinfo.tm_year + 1900);
    } else {
        Serial.println("Failed to get time from NTP server, using default values");
        doc["day"] = 1;
        doc["month"] = 1;
        doc["year"] = 2025;
    }

    String payload;
    serializeJson(doc, payload);

    Serial.println("Schedule request payload prepared: " + payload);
    wsClient.send(payload);
    Serial.println("Schedule request sent!");
}

// Helper functions implementation
String getCurrentClassId() {
    return currentClassId;
}

String getCurrentCollectionId() {
    return currentCollectionId;
}

void setCurrentClassId(const String& classId) {
    if (classId.length() > 0) {
        currentClassId = classId;
        currentCollectionId = "attendance-system-" + classId;
        Serial.println("=== CLASS ID MANUALLY SET ===");
        Serial.println("Class ID: " + currentClassId);
        Serial.println("Collection ID: " + currentCollectionId);
        Serial.println("=============================");
    } else {
        Serial.println("ERROR: Cannot set empty class_id!");
        Serial.println("Class ID must be provided (e.g., 'D22CQCI01-N')");
    }
}

void setAutoScheduleOnConnect(bool enable) {
    autoScheduleOnConnect = enable;
    if (enable) {
        Serial.println("Auto-schedule on connection: ENABLED");
    } else {
        Serial.println("Auto-schedule on connection: DISABLED");
    }
}

void requestScheduleUpdate() {
    Serial.println("Requesting schedule update...");
    websocketSendSchedule();
}
