#ifndef WIFI_CONFIG_PAGE_H
#define WIFI_CONFIG_PAGE_H

#include <Arduino.h>

const char WIFI_CONFIG_HTML[] PROGMEM = R"html(
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Attendance System - WiFi Configuration</title>
    <style>
        * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: #f7f7f7;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            max-width: 480px;
            width: 100%;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 24px;
        }

        /* Header */
        .header {
            margin-bottom: 24px;
            text-align: center;
        }

        .header-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .header-title h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #24303f;
        }

        .header-description {
            color: #6b7280;
            font-size: 0.875rem;
        }

        /* Status bar */
        .status {
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 6px;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status-info {
            background-color: #f3f4f6;
            color: #4b5563;
        }

        .status-success {
            background-color: #f0fdf4;
            color: #166534;
            border: 1px solid #dcfce7;
        }

        .status-error {
            background-color: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fee2e2;
        }

        .status-warning {
            background-color: #fffbeb;
            color: #92400e;
            border: 1px solid #fef3c7;
        }

        /* Form elements */
        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            margin-bottom: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
        }

        select, input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 0.875rem;
            color: #1f2937;
            transition: all 0.2s;
        }

        select:focus, input:focus {
            outline: none;
            border-color: #ebf45d;
            box-shadow: 0 0 0 2px rgba(235, 244, 93, 0.3);
        }

        .button-row {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }

        button {
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .primary-btn {
            background-color: #ebf45d;
            color: #24303f;
            flex: 1;
        }

        .primary-btn:hover {
            background-color: #d9e154;
        }

        .primary-btn:disabled {
            background-color: #e5e7eb;
            color: #9ca3af;
            cursor: not-allowed;
        }

        .secondary-btn {
            background-color: #f3f4f6;
            color: #4b5563;
            flex: 1;
        }

        .secondary-btn:hover {
            background-color: #e5e7eb;
        }

        .secondary-btn:disabled {
            background-color: #f9fafb;
            color: #d1d5db;
            cursor: not-allowed;
        }

        .full-width-btn {
            width: 100%;
            margin-top: 12px;
        }

        /* Icons */
        .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
        }

        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #6b7280;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Device info box */
        .info-box {
            margin-top: 20px;
            padding: 16px;
            background-color: #f0fdf4;
            border: 1px solid #dcfce7;
            border-radius: 6px;
            font-size: 0.875rem;
            color: #166534;
        }

        .info-box-title {
            font-weight: 600;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title">
                <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C10.0222 2 8.08879 2.58649 6.4443 3.6853C4.79981 4.78412 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7363 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12 20C10.4178 20 8.87104 19.5308 7.55544 18.6518C6.23985 17.7727 5.21447 16.5233 4.60897 15.0615C4.00347 13.5997 3.84504 11.9911 4.15372 10.4393C4.4624 8.88743 5.22433 7.46197 6.34315 6.34315C7.46197 5.22433 8.88743 4.4624 10.4393 4.15372C11.9911 3.84504 13.5997 4.00346 15.0615 4.60896C16.5233 5.21447 17.7727 6.23984 18.6518 7.55544C19.5308 8.87103 20 10.4177 20 12C20 14.1217 19.1572 16.1566 17.6569 17.6569C16.1566 19.1571 14.1217 20 12 20Z" fill="#24303f"/>
                    <path d="M12 6V12L16 14" stroke="#24303f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h1>Attendance System</h1>
            </div>
            <p class="header-description">WiFi Configuration</p>
        </div>

        <div id="status" class="status status-info">
            <div id="status-spinner" class="loading-spinner"></div>
            <span id="status-text">Initializing...</span>
        </div>

        <form id="wifi-form">
            <div class="form-group">
                <label for="ssid">WiFi Network</label>
                <select id="ssid">
                    <option value="">Select WiFi Network</option>
                </select>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="Enter WiFi Password">
            </div>

            <div class="button-row">
                <button type="button" id="scan-button" class="secondary-btn" onclick="scanWifi()">
                    <div id="scan-icon" class="icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <span id="scan-text">Scan WiFi</span>
                </button>
                <button type="button" id="save-button" class="primary-btn" onclick="saveWifi()">
                    <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Save & Connect
                </button>
            </div>

            <button type="button" onclick="reStart()" class="secondary-btn full-width-btn">
                <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Restart Device
            </button>
        </form>

        <div class="info-box">
            <div class="info-box-title">How to connect Wifi:</div>
            <div>1. Scan or select your WiFi network</div>
            <div>2. Enter the password</div>
            <div>3. Click "Save & Connect"</div>
            <div>4. Device will restart and connect to WiFi</div>
        </div>
    </div>

    <script>
        var xhr = new XMLHttpRequest();

        // Update status message
        function updateStatus(message, type) {
            const statusElement = document.getElementById("status");
            const statusTextElement = document.getElementById("status-text");
            const spinnerElement = document.getElementById("status-spinner");

            if (!message) {
                statusElement.style.display = "none";
                return;
            }

            statusElement.style.display = "flex";
            statusTextElement.innerText = message;

            statusElement.classList.remove("status-info", "status-success", "status-error", "status-warning");
            statusElement.classList.add("status-" + type);

            spinnerElement.style.display = type === "info" ? "inline-block" : "none";
        }

        // Scan WiFi networks
        function scanWifi() {
            updateStatus("Scanning WiFi networks...", "info");

            var scanIcon = document.getElementById('scan-icon');
            var scanText = document.getElementById('scan-text');
            var scanButton = document.getElementById('scan-button');

            scanIcon.innerHTML = '<div class="loading-spinner"></div>';
            scanText.textContent = 'Scanning...';
            scanButton.disabled = true;

            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    scanIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    scanText.textContent = 'Scan Again';
                    scanButton.disabled = false;

                    if (xhr.status == 200) {
                        try {
                            var networks = JSON.parse(xhr.responseText);
                            updateStatus("Found " + networks.length + " network(s)", "success");

                            var select = document.getElementById("ssid");
                            select.innerHTML = "<option value=''>Select WiFi Network</option>";

                            for (var i = 0; i < networks.length; i++) {
                                var option = document.createElement("option");
                                option.value = networks[i];
                                option.text = networks[i];
                                select.appendChild(option);
                            }
                        } catch (e) {
                            updateStatus("Error: " + e.message, "error");
                        }
                    } else {
                        updateStatus("Scan failed. Please try again.", "error");
                    }
                }
            };

            xhr.open("GET", "/scanWifi", true);
            xhr.send();
        }

        // Save WiFi credentials
        function saveWifi() {
            var ssid = document.getElementById("ssid").value;
            var password = document.getElementById("password").value;

            if (!ssid) {
                updateStatus("Please select a WiFi network", "warning");
                return;
            }

            updateStatus("Saving WiFi credentials...", "info");

            var saveButton = document.getElementById('save-button');
            var scanButton = document.getElementById('scan-button');
            saveButton.disabled = true;
            scanButton.disabled = true;

            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        updateStatus("WiFi credentials saved! Connecting to " + ssid + "...", "info");

                        // Đợi 2 giây rồi kiểm tra kết nối
                        setTimeout(function() {
                            checkWiFiConnection(ssid);
                        }, 2000);
                    } else {
                        updateStatus("Failed to save WiFi credentials", "error");
                        saveButton.disabled = false;
                        scanButton.disabled = false;
                    }
                }
            };

            xhr.open("GET", "/saveWifi?ssid=" + encodeURIComponent(ssid) + "&pass=" + encodeURIComponent(password), true);
            xhr.send();
        }

        // Kiểm tra kết nối WiFi
        function checkWiFiConnection(ssid) {
            updateStatus("Verifying WiFi connection...", "info");

            var checkXhr = new XMLHttpRequest();
            checkXhr.timeout = 8000; // 8 giây timeout

            checkXhr.onreadystatechange = function() {
                if (checkXhr.readyState == 4) {
                    if (checkXhr.status == 200) {
                        try {
                            var response = JSON.parse(checkXhr.responseText);
                            if (response.connected) {
                                updateStatus("✓ Connected to " + ssid + " successfully! Device will restart in 3 seconds...", "success");

                                // Đợi 3 giây để người dùng đọc thông báo
                                setTimeout(function() {
                                    updateStatus("Restarting device...", "info");
                                    // Gọi restart
                                    var restartXhr = new XMLHttpRequest();
                                    restartXhr.open("GET", "/reStart", true);
                                    restartXhr.send();

                                    setTimeout(function() {
                                        updateStatus("Device restarted. You can close this page.", "success");
                                    }, 2000);
                                }, 3000);
                            } else {
                                updateStatus("Failed to connect to " + ssid + ". Please check password and try again.", "error");
                                document.getElementById('save-button').disabled = false;
                                document.getElementById('scan-button').disabled = false;
                            }
                        } catch (e) {
                            updateStatus("Connection verification failed. Please restart device manually.", "warning");
                        }
                    } else {
                        updateStatus("Cannot verify connection. Device may be restarting...", "warning");
                    }
                }
            };

            checkXhr.ontimeout = function() {
                updateStatus("Connection check timeout. Device may be restarting...", "warning");
            };

            checkXhr.open("GET", "/checkConnection", true);
            checkXhr.send();
        }

        // Restart device
        function reStart() {
            if (confirm("Are you sure you want to restart the device?")) {
                updateStatus("Restarting device...", "info");

                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        updateStatus("Device restarted successfully", "success");
                    }
                };

                xhr.open("GET", "/reStart", true);
                xhr.send();
            }
        }

        // Auto scan on page load
        window.onload = function() {
            setTimeout(scanWifi, 500);
        };
    </script>
</body>
</html>
)html";

#endif
