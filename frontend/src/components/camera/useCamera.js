import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_SIDE = 640
const JPEG_QUALITY = 0.85

const ERROR_COPY = {
    insecure: 'The camera only works on https:// or http://localhost. Open SATS X on this computer at localhost.',
    unsupported: 'This browser cannot use a camera. Try the latest Chrome, Edge or Safari.',
    NotAllowedError: 'Camera access was blocked. Allow the camera in the browser address bar, then try again.',
    NotFoundError: 'No camera was found. Connect a webcam and try again.',
    NotReadableError: 'Another app is using the camera. Close it and try again.',
    OverconstrainedError: 'The selected camera is not available. Pick another camera.'
}

export const cameraErrorMessage = (code) => ERROR_COPY[code] ?? 'The camera could not start. Try again.'

/**
 * Mở webcam qua getUserMedia và chụp khung hình thành JPEG base64 (tối đa 640px)
 * — đủ cho nhận diện mà vẫn nhỏ hơn giới hạn 1 MB của API.
 */
export default function useCamera({ autoStart = true } = {}) {
    const nodeRef = useRef(null)
    const streamRef = useRef(null)
    const [status, setStatus] = useState('idle') // idle | starting | ready | error
    const [error, setError] = useState(null)
    const [devices, setDevices] = useState([])
    const [deviceId, setDeviceId] = useState(() => {
        try {
            return localStorage.getItem('satsx_camera') || ''
        } catch {
            return ''
        }
    })

    const stop = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        if (nodeRef.current) nodeRef.current.srcObject = null
        setStatus('idle')
    }, [])

    const start = useCallback(
        async (requestedId = deviceId) => {
            if (!window.isSecureContext) {
                setError('insecure')
                setStatus('error')
                return
            }
            if (!navigator.mediaDevices?.getUserMedia) {
                setError('unsupported')
                setStatus('error')
                return
            }

            streamRef.current?.getTracks().forEach((track) => track.stop())
            setStatus('starting')
            setError(null)

            const video = { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            try {
                let stream
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: requestedId ? { ...video, deviceId: { exact: requestedId } } : video
                    })
                } catch (err) {
                    // Camera đã lưu có thể đã bị rút ra; thử lại với camera mặc định.
                    if (!requestedId || err.name !== 'OverconstrainedError') throw err
                    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video })
                }

                streamRef.current = stream
                if (nodeRef.current) {
                    nodeRef.current.srcObject = stream
                    await nodeRef.current.play().catch(() => {})
                }

                const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')
                setDevices(list)
                const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId || ''
                setDeviceId(activeId)
                setStatus('ready')
            } catch (err) {
                setError(err?.name || 'unknown')
                setStatus('error')
            }
        },
        [deviceId]
    )

    const selectDevice = useCallback(
        (id) => {
            setDeviceId(id)
            try {
                localStorage.setItem('satsx_camera', id)
            } catch {
                // Không lưu được lựa chọn thì lần sau dùng camera mặc định.
            }
            start(id)
        },
        [start]
    )

    // Callback ref: thẻ <video> có thể bị gỡ rồi gắn lại (ví dụ sau khi xem ảnh vừa chụp),
    // nên mỗi lần gắn phải nối lại luồng camera đang mở.
    const videoRef = useCallback((node) => {
        nodeRef.current = node
        if (node && streamRef.current && node.srcObject !== streamRef.current) {
            node.srcObject = streamRef.current
            node.play().catch(() => {})
        }
    }, [])

    /** Trả về data URL JPEG của khung hình hiện tại, hoặc null nếu camera chưa sẵn sàng. */
    const capture = useCallback(() => {
        const node = nodeRef.current
        if (!node || !node.videoWidth) return null

        const scale = Math.min(1, MAX_SIDE / Math.max(node.videoWidth, node.videoHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(node.videoWidth * scale)
        canvas.height = Math.round(node.videoHeight * scale)
        canvas.getContext('2d').drawImage(node, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    }, [])

    useEffect(() => {
        if (autoStart) start()
        return () => streamRef.current?.getTracks().forEach((track) => track.stop())
        // Chỉ mở camera một lần khi mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { videoRef, status, error, devices, deviceId, start, stop, capture, selectDevice }
}

/** Đọc ảnh người dùng chọn từ máy và thu nhỏ giống ảnh chụp từ camera. */
export const fileToJpeg = (file) =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
            URL.revokeObjectURL(url)
            resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('This file is not an image'))
        }
        img.src = url
    })
