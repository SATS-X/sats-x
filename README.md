# Attendance System — Frontend

Dashboard React cho giáo viên: quản lý sinh viên/lớp/môn học, xem lịch dạy,
theo dõi điểm danh thời gian thực, đăng ký khuôn mặt cho AWS Rekognition. Một
trong 4 repo của hệ thống — xem [kiến trúc tổng thể](#hệ-thống-tổng-thể) ở cuối
file.

**Stack:** React 18 + Vite · Tailwind CSS · React Router · WebSocket (API Gateway) · Axios (REST)

---

## Chạy lần đầu

```bash
npm install
cp .env.example .env   # điền URL backend + WebSocket, xem bên dưới
npm run dev
```

Mặc định chạy ở `http://localhost:3000` (cấu hình trong `vite.config.js`, khác
port mặc định 5173 của Vite).

### Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_BASE_URL` | Gốc URL REST API (`attendance-system-be`) — VD `http://localhost:4000` khi chạy backend cục bộ, hoặc `http://<ec2-ip>:4000` khi trỏ vào server thật |
| `VITE_WS_URL` | URL WebSocket API Gateway (`wss://...`), lấy từ `terraform output websocket_url` ở repo infra |
| `VITE_AWS_REGION` / `VITE_AWS_S3_BUCKET` | Chỉ dùng để dựng đường dẫn ảnh public, **không phải credentials** |

Mọi biến `VITE_*` bị Vite build thẳng vào bundle JS, ai mở DevTools cũng đọc
được — **không bao giờ** đặt AWS access key/secret key ở đây. Thao tác cần
quyền ghi AWS (upload ảnh, gọi Rekognition) đều đi qua Lambda dùng IAM role,
không đi qua frontend.

### Tài khoản đăng nhập

Seed sẵn trên backend (`npm run db:seed` ở repo `attendance-system-be`):

| Email | Mật khẩu |
|---|---|
| `gv.nguyen@ptit.edu.vn` | `MatKhau123` |

---

## Cấu trúc chính

```
src/
  api/            REST client (axios) + WebSocket action helpers theo domain
  components/     UI dùng lại được (ui/ = design system token-based), theo tính năng
  contexts/       Auth, WebSocket, Toast, Theme, Language — React Context, không Redux
  pages/          Một route = một trang
  config/         Đọc biến môi trường, hằng số chia sẻ
```

**WebSocket** (`contexts/WebSocketContext.jsx`) là một kết nối duy nhất, sống ở
gốc `App`, dùng chung cho điểm danh thời gian thực và quản lý khuôn mặt — không
mở nhiều kết nối cho từng trang. Có heartbeat (`ping` mỗi 25s) để giữ kết nối
sống qua NAT/firewall hay cắt idle sớm hơn timeout 10 phút của API Gateway.

**Auth**: access token (15 phút) giữ trong bộ nhớ React, refresh token nằm
trong cookie `httpOnly` do backend set — `axios` luôn gửi kèm `withCredentials:
true`. Không lưu access token vào `localStorage`.

---

## Build & triển khai

```bash
npm run build      # ra dist/, dùng .env.production nếu có
```

Frontend hiện được host **cùng một EC2** với backend, qua nginx (không phải S3
tĩnh) — nginx vừa serve `dist/` vừa reverse-proxy `/api/*` sang backend nội bộ,
để trình duyệt thấy cùng-origin (không CORS, cookie refresh token hoạt động
đúng). Cấu hình ở `deploy/nginx.conf`, dùng `.env.production` với
`VITE_API_BASE_URL` để **rỗng** (đường dẫn tương đối).

```bash
npm run build
scp -r dist deploy ubuntu@<ec2-ip>:~/attendance-system-fe/
ssh ubuntu@<ec2-ip> "cd attendance-system-be && sudo docker compose -f docker-compose.prod.yml up -d --build web"
```

Service `web` (nginx) được khai báo trong `docker-compose.prod.yml` ở repo
`attendance-system-be`, mount `../attendance-system-fe/dist` — hai repo phải
nằm cạnh nhau trên EC2 (`~/attendance-system-be`, `~/attendance-system-fe`).

---

## Hệ thống tổng thể

Frontend này là một trong 4 repo tạo nên hệ thống điểm danh:

| Repo | Vai trò |
|---|---|
| `attendance-system-fe` | *(repo này)* Dashboard giáo viên |
| `attendance-system-be` | REST API — dữ liệu nghiệp vụ, xác thực giáo viên |
| `attendance-system-infra` | Terraform: API Gateway WebSocket, Lambda, S3, Rekognition, IoT Core, EC2 |
| `attendance-system-iot` | Firmware ESP32/ESP32-CAM chụp ảnh, điểm danh tự động |

```
Trình duyệt (repo này) --HTTP--> Backend API (attendance-system-be)
                        --WSS--> API Gateway (điểm danh/quản lý khuôn mặt thời gian thực)
                                    |
                                    +--> Lambda --> S3 / Rekognition / MQTT (ra lệnh cho ESP32-CAM)
```
