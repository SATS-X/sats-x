# 🔌 WebSocket Connection System

Hệ thống kết nối WebSocket tới AWS API Gateway với tính năng auto-reconnect và message handling.

## 🌐 WebSocket Endpoint

WebSocket URL được cấu hình trong `src/config/api.jsx`:

```javascript
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/'
```

**Default URL:**
```
wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/
```

**Để thay đổi URL**, tạo file `.env` trong root project:
```env
VITE_WS_URL=wss://your-custom-websocket-url.com/production/
```

## ✨ Tính năng

- ✅ **Auto-connect**: Tự động kết nối khi app khởi động
- ✅ **Auto-reconnect**: Tự động kết nối lại với exponential backoff
- ✅ **Heartbeat**: Gửi ping mỗi 30 giây để giữ kết nối
- ✅ **Message Subscription**: Subscribe theo loại message cụ thể
- ✅ **Status Display**: Hiển thị trạng thái kết nối real-time
- ✅ **Toast Notifications**: Thông báo kết nối/mất kết nối
- ✅ **Manual Control**: Kết nối/ngắt kết nối thủ công

## 📦 Cài đặt

Đã tích hợp sẵn trong `App.jsx` với `WebSocketProvider`.

## 🚀 Cách sử dụng

### 1. Sử dụng WebSocket Context

```jsx
import { useWebSocket } from '../../contexts/WebSocketContext'

const MyComponent = () => {
    const { 
        isConnected, 
        connectionStatus, 
        sendMessage, 
        lastMessage,
        connect,
        disconnect 
    } = useWebSocket()

    const handleSendMessage = () => {
        sendMessage({
            action: 'message',
            data: { text: 'Hello WebSocket!' }
        })
    }

    return (
        <div>
            <p>Status: {connectionStatus}</p>
            <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
            <button onClick={handleSendMessage}>Send</button>
        </div>
    )
}
```

### 2. Subscribe to specific message types

```jsx
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useEffect } from 'react'

const AttendanceComponent = () => {
    const { subscribe } = useWebSocket()

    useEffect(() => {
        // Subscribe to 'attendance_update' messages
        const unsubscribe = subscribe('attendance_update', (data) => {
            console.log('Attendance updated:', data)
            // Update your state here
        })

        // Cleanup on unmount
        return () => unsubscribe()
    }, [subscribe])

    return <div>Attendance Component</div>
}
```

### 3. Sử dụng Hook useWebSocketMessage

```jsx
import { useWebSocketMessage } from '../../hooks/useWebSocketMessage'

const NotificationComponent = () => {
    // Subscribe to all messages
    useWebSocketMessage('*', (data) => {
        console.log('Received message:', data)
    }, [])

    // Subscribe to specific type
    useWebSocketMessage('notification', (data) => {
        alert(`New notification: ${data.message}`)
    }, [])

    return <div>Notifications</div>
}
```

### 4. Hiển thị trạng thái WebSocket

```jsx
import WebSocketStatus from '../../components/shared/WebSocketStatus'

const Dashboard = () => {
    return (
        <div>
            <WebSocketStatus />
            {/* Your dashboard content */}
        </div>
    )
}
```

## 📖 API Reference

### useWebSocket()

Hook để truy cập WebSocket context.

**Returns:**
```javascript
{
    isConnected: boolean,          // Trạng thái kết nối
    connectionStatus: string,      // 'connected', 'connecting', 'disconnected', 'error'
    lastMessage: any,              // Message cuối cùng nhận được
    reconnectAttempt: number,      // Số lần đã thử reconnect
    connect: () => void,           // Kết nối thủ công
    disconnect: () => void,        // Ngắt kết nối
    sendMessage: (msg) => boolean, // Gửi message
    subscribe: (type, handler) => function  // Subscribe to messages
}
```

### sendMessage(message)

Gửi message qua WebSocket.

```javascript
// Gửi object
sendMessage({
    action: 'sendMessage',
    data: { 
        text: 'Hello',
        userId: '123'
    }
})

// Gửi string
sendMessage('Hello WebSocket')
```

### subscribe(messageType, handler)

Subscribe to specific message types.

```javascript
const unsubscribe = subscribe('attendance_update', (data) => {
    console.log('Got attendance update:', data)
})

// Don't forget to unsubscribe
unsubscribe()
```

**Special message types:**
- `'*'` - Subscribe to ALL messages
- `'ping'` - Heartbeat messages
- Custom types based on your backend

## 🎯 Message Format

### Sending Messages

```javascript
{
    "action": "message",     // Required: action type
    "data": {               // Optional: your data
        "key": "value"
    }
}
```

### Receiving Messages

```javascript
{
    "type": "attendance_update",  // Message type for routing
    "data": {                     // Your data
        "studentId": "123",
        "status": "present"
    },
    "timestamp": 1234567890
}
```

## 🔄 Auto-Reconnect

Hệ thống tự động reconnect với exponential backoff:

- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds
- Maximum: 30 seconds

## 💡 Ví dụ thực tế

### Ví dụ 1: Real-time attendance updates

```jsx
import { useWebSocketMessage } from '../../hooks/useWebSocketMessage'
import { useState } from 'react'

const AttendanceMonitor = () => {
    const [attendances, setAttendances] = useState([])

    useWebSocketMessage('attendance_update', (data) => {
        setAttendances(prev => [...prev, data])
    }, [])

    return (
        <div>
            <h2>Real-time Attendance</h2>
            {attendances.map((att, idx) => (
                <div key={idx}>
                    Student {att.studentId}: {att.status}
                </div>
            ))}
        </div>
    )
}
```

### Ví dụ 2: Send message with button

```jsx
import { useWebSocket } from '../../contexts/WebSocketContext'

const MessageSender = () => {
    const { sendMessage, isConnected } = useWebSocket()

    const handleClick = () => {
        if (isConnected) {
            sendMessage({
                action: 'broadcast',
                message: 'Hello everyone!'
            })
        }
    }

    return (
        <button 
            onClick={handleClick}
            disabled={!isConnected}
        >
            Send Message
        </button>
    )
}
```

### Ví dụ 3: Display connection status

```jsx
import { useWebSocket } from '../../contexts/WebSocketContext'

const ConnectionIndicator = () => {
    const { connectionStatus, reconnectAttempt } = useWebSocket()

    return (
        <div className={`status-${connectionStatus}`}>
            Status: {connectionStatus}
            {reconnectAttempt > 0 && ` (Attempt ${reconnectAttempt})`}
        </div>
    )
}
```

### Ví dụ 4: Subscribe to multiple message types

```jsx
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useEffect } from 'react'

const MultiSubscriber = () => {
    const { subscribe } = useWebSocket()

    useEffect(() => {
        // Subscribe to multiple types
        const unsubscribe1 = subscribe('type1', handleType1)
        const unsubscribe2 = subscribe('type2', handleType2)
        const unsubscribeAll = subscribe('*', handleAllMessages)

        return () => {
            unsubscribe1()
            unsubscribe2()
            unsubscribeAll()
        }
    }, [subscribe])

    const handleType1 = (data) => {
        console.log('Type 1:', data)
    }

    const handleType2 = (data) => {
        console.log('Type 2:', data)
    }

    const handleAllMessages = (data) => {
        console.log('All messages:', data)
    }

    return <div>Multi Subscriber</div>
}
```

## 🎨 WebSocket Status Component

Component sẵn có để hiển thị trạng thái:

```jsx
import WebSocketStatus from '../../components/shared/WebSocketStatus'

// Trong component của bạn
<WebSocketStatus />
```

**Features:**
- 🟢 Green: Connected
- 🔵 Blue: Connecting (với spinner)
- 🔴 Red: Error
- ⚫ Gray: Disconnected
- Buttons để connect/disconnect thủ công
- Hiển thị số lần reconnect

## 🔧 Configuration

### Thay đổi WebSocket URL

**Cách 1: Sử dụng Environment Variables (Khuyến nghị)**

Tạo file `.env` trong root project:

```env
VITE_WS_URL=wss://your-new-endpoint.com/production/
```

**Cách 2: Thay đổi trực tiếp trong config**

Trong `src/config/api.jsx`:

```javascript
export const WS_URL = 'wss://your-new-endpoint.com/production/'
```

### Thay đổi heartbeat interval

```javascript
// Current: 30 seconds
heartbeatIntervalRef.current = setInterval(() => {
    // ...
}, 30000) // Change this value
```

### Thay đổi reconnect logic

```javascript
// Current: exponential backoff với max 30s
const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000)
```

## 🐛 Troubleshooting

**Q: WebSocket không kết nối được?**
- Kiểm tra URL endpoint có đúng không
- Kiểm tra network/firewall
- Xem console logs để debug

**Q: Mất kết nối liên tục?**
- Check heartbeat có hoạt động không
- Kiểm tra backend có accept ping messages không
- Xem reconnectAttempt counter

**Q: Message không nhận được?**
- Kiểm tra đã subscribe đúng message type chưa
- Xem console logs cho incoming messages
- Đảm bảo message format đúng

**Q: Memory leak khi unmount?**
- Đảm bảo call unsubscribe() trong useEffect cleanup
- Check no lingering intervals/timeouts

## 📊 Message Types Examples

### Backend gửi đến Frontend

```javascript
// Attendance update
{
    "type": "attendance_update",
    "data": {
        "studentId": "B21DCCN123",
        "subjectId": "INT1234",
        "status": "present",
        "timestamp": "2024-10-12T10:30:00Z"
    }
}

// Notification
{
    "type": "notification",
    "data": {
        "title": "New Announcement",
        "message": "Class will start 10 minutes late",
        "priority": "high"
    }
}

// Schedule update
{
    "type": "schedule_update",
    "data": {
        "subjectId": "INT1234",
        "changes": {
            "room": "A101",
            "time": "14:00"
        }
    }
}
```

### Frontend gửi đến Backend

```javascript
// Send message
{
    "action": "sendMessage",
    "message": "Hello from client"
}

// Heartbeat
{
    "action": "ping"
}

// Custom action
{
    "action": "subscribe",
    "topics": ["attendance", "notifications"]
}
```

## 📝 Best Practices

1. **Always unsubscribe**: Cleanup subscriptions trong useEffect
2. **Check isConnected**: Trước khi gửi message
3. **Handle reconnection**: UI nên show reconnecting state
4. **Message validation**: Validate data trước khi xử lý
5. **Error handling**: Wrap message handlers trong try-catch
6. **Performance**: Không subscribe quá nhiều handlers
7. **Security**: Validate message source nếu cần

---

Made with ❤️ for NCKH 2024-2025

