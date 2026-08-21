import { createContext, useContext } from 'react'
import PropTypes from 'prop-types'
import { useWebSocket } from './WebSocketContext'

const FaceManagementWebSocketContext = createContext(null)

export const useFaceManagementWebSocket = () => {
    return useWebSocket()
}

export const FaceManagementWebSocketProvider = ({ children }) => {
    const ws = useWebSocket()
    return (
        <FaceManagementWebSocketContext.Provider value={ws}>
            {children}
        </FaceManagementWebSocketContext.Provider>
    )
}

FaceManagementWebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default FaceManagementWebSocketContext
