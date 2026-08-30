#include "camera_manager.h"
#include "camera_config.h"
#include "display_manager.h"
#include <TJpg_Decoder.h>
#include <Arduino.h>
#include <base64.h>

const char PROGMEM base64_table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

void cameraInit() {
  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA; // 320x240
  config.jpeg_quality = 12;
  config.fb_count = 1;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // Khởi tạo LED flash
  flashLedInit();
  Serial.println("LED Flash initialized");

  sensor_t * s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 1);
    s->set_contrast(s, 1);
    s->set_saturation(s, 1);
    s->set_special_effect(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_gain_ctrl(s, 1);
    s->set_agc_gain(s, 30);
    s->set_aec_value(s, 500);
    s->set_ae_level(s, 0);
    s->set_exposure_ctrl(s, 1);
    s->set_denoise(s, 1);
    s->set_sharpness(s, 1);
    s->set_dcw(s, 1);
    s->set_raw_gma(s, 1);
    s->set_lenc(s, 1);
    s->set_wpc(s, 1);
    s->set_bpc(s, 1);
  }
}

void streamCamera() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb || fb->format != PIXFORMAT_JPEG) {
    Serial.println("Camera Capture Failed!");
  } else {
    displayCameraFrame((const uint8_t*)fb->buf, fb->len);
  }
  esp_camera_fb_return(fb);
}

size_t encode_base64(const uint8_t *input, size_t input_len, char *output) {
    size_t i, j;
    for(i = 0, j = 0; i < input_len;) {
        uint32_t octet_a = i < input_len ? input[i++] : 0;
        uint32_t octet_b = i < input_len ? input[i++] : 0;
        uint32_t octet_c = i < input_len ? input[i++] : 0;

        uint32_t triple = (octet_a << 16) | (octet_b << 8) | octet_c;

        output[j++] = base64_table[(triple >> 18) & 0x3F];
        output[j++] = base64_table[(triple >> 12) & 0x3F];
        output[j++] = base64_table[(triple >> 6) & 0x3F];
        output[j++] = base64_table[triple & 0x3F];
    }
    // Thêm '=' padding khi cần
    size_t mod = input_len % 3;
    if(mod) {
        output[j - 1] = '=';
        if(mod == 1) output[j - 2] = '=';
    }
    return j;
}

// LED Flash functions
void flashLedInit() {
    pinMode(FLASH_LED_GPIO_NUM, OUTPUT);
    digitalWrite(FLASH_LED_GPIO_NUM, LOW); // Tắt LED ban đầu
}

void flashLedOn() {
    digitalWrite(FLASH_LED_GPIO_NUM, HIGH);
}

void flashLedOff() {
    digitalWrite(FLASH_LED_GPIO_NUM, LOW);
}

void flashLedBlink(int duration_ms) {
    flashLedOn();
    delay(duration_ms);
    flashLedOff();
}

String capturePhotoAndEncodeBase64() {
    // Bật LED flash trước khi chụp
    flashLedOn();
    delay(100); // Đợi 100ms để LED sáng ổn định

    camera_fb_t *fb = esp_camera_fb_get();

    // Tắt LED flash sau khi chụp
    flashLedOff();

    if(!fb) {
        Serial.println("Camera capture failed");
        return "";
    }
    // Encode to base64 (giới hạn ảnh < 160kB để payload < 200kB)
    size_t encoded_len = (fb->len + 2) / 3 * 4;
    char *base64_buf = (char*)malloc(encoded_len + 1);
    if(!base64_buf) {
        esp_camera_fb_return(fb);
        Serial.println("Malloc failed");
        return "";
    }
    // Base64 encode
    size_t out_len = encode_base64((const uint8_t*)fb->buf, fb->len, base64_buf);
    base64_buf[out_len] = '\0';
    String base64_str = String(base64_buf);

    free(base64_buf);
    esp_camera_fb_return(fb);
    return base64_str;
}