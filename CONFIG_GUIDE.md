# ⚙️ Configuration Guide

Hướng dẫn cấu hình API và WebSocket URLs cho dự án.

## 📁 File cấu hình: `src/config/api.jsx`

```javascript
// REST API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

// WebSocket URL
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/'
```

## 🔧 Cách cấu hình

### Option 1: Sử dụng Environment Variables (Khuyến nghị)

Tạo file `.env` trong root project:

```env
# REST API Configuration
VITE_API_BASE_URL=http://localhost:4000

# WebSocket Configuration  
VITE_WS_URL=wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/
```

**Lưu ý:** 
- File `.env` không được commit vào Git
- Tạo file `.env.local` cho local development
- Prefix `VITE_` là bắt buộc cho Vite

### Option 2: Thay đổi trực tiếp trong code

Chỉnh sửa `src/config/api.jsx`:

```javascript
export const API_BASE_URL = 'https://your-api-domain.com'
export const WS_URL = 'wss://your-websocket-domain.com/production/'
```

## 🌍 Môi trường khác nhau

### Development (Local)

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

### Staging

```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com
VITE_WS_URL=wss://staging-ws.yourdomain.com/production/
```

### Production

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/
```

## 📝 Sử dụng trong code

### Import API_BASE_URL

```javascript
import { API_BASE_URL } from '../config/api'

const response = await axios.get(`${API_BASE_URL}/api/students`)
```

### Import WS_URL

```javascript
import { WS_URL } from '../config/api'

const ws = new WebSocket(WS_URL)
```

## 🔒 Bảo mật

1. **Không commit** file `.env` vào Git
2. **Sử dụng** `.env.example` để document các biến cần thiết
3. **Không hardcode** sensitive data trong code
4. **Sử dụng** environment variables cho production

## 📋 Checklist khi deploy

- [ ] Tạo file `.env` với URLs production
- [ ] Kiểm tra `VITE_API_BASE_URL` đúng
- [ ] Kiểm tra `VITE_WS_URL` đúng  
- [ ] Test kết nối API
- [ ] Test kết nối WebSocket
- [ ] Xóa console.logs nếu cần

## 🐛 Troubleshooting

**Q: API không kết nối được?**
- Kiểm tra `VITE_API_BASE_URL` trong `.env`
- Kiểm tra API server đang chạy
- Check CORS settings

**Q: WebSocket không kết nối được?**
- Kiểm tra `VITE_WS_URL` trong `.env`
- Đảm bảo URL bắt đầu bằng `wss://` (production) hoặc `ws://` (local)
- Check WebSocket server đang chạy

**Q: Environment variables không hoạt động?**
- Đảm bảo prefix `VITE_` có trong tên biến
- Restart dev server sau khi thay đổi `.env`
- Kiểm tra file `.env` ở đúng root directory

---

Made with ❤️ for NCKH 2024-2025

