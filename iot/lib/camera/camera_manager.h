#ifndef CAMERA_MANAGER_H
#define CAMERA_MANAGER_H

#include "esp_camera.h"
#include "camera_config.h"
#include "display_manager.h"
#include <TJpg_Decoder.h>
#include <Arduino.h>

void cameraInit();
void streamCamera();
String capturePhotoAndEncodeBase64();
size_t encode_base64(const uint8_t *input, size_t input_len, char *output);

// LED Flash functions
void flashLedInit();
void flashLedOn();
void flashLedOff();
void flashLedBlink(int duration_ms = 100);

#endif