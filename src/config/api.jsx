// API Configuration
// You can set the API base URL through environment variables
// For development: VITE_API_BASE_URL=http://localhost:4000
// For production: VITE_API_BASE_URL=https://your-api-domain.com

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

// WebSocket Configuration
// You can set the WebSocket URL through environment variables
// For development: VITE_WS_URL=ws://localhost:4000
// For production: VITE_WS_URL=wss://your-websocket-domain.com
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/'

export default {
    API_BASE_URL,
    WS_URL
}
