import { useEffect, useRef, useState } from 'react'

/**
 * Chụp và gửi một khung hình mỗi `intervalMs` khi `enabled`, không bao giờ có hai
 * request cùng lúc, và tạm dừng khi tab bị ẩn để không tốn CPU của máy chủ.
 */
export default function useRecognitionLoop({ camera, identify, enabled, intervalMs = 1200, onResult }) {
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const identifyRef = useRef(identify)
    const onResultRef = useRef(onResult)
    identifyRef.current = identify
    onResultRef.current = onResult

    useEffect(() => {
        if (!enabled || camera.status !== 'ready') return undefined

        let stopped = false
        let timer = null
        const controller = new AbortController()

        const tick = async () => {
            if (stopped) return
            if (document.visibilityState === 'visible') {
                const frame = camera.capture()
                if (frame) {
                    try {
                        const res = await identifyRef.current(frame, controller.signal)
                        if (stopped) return
                        setResult(res)
                        setError(null)
                        onResultRef.current?.(res, frame)
                    } catch (err) {
                        if (stopped || err?.name === 'CanceledError') return
                        setError(err?.response?.data?.message || err.message)
                    }
                }
            }
            if (!stopped) timer = setTimeout(tick, intervalMs)
        }

        tick()
        return () => {
            stopped = true
            clearTimeout(timer)
            controller.abort()
        }
        // camera.capture là hàm ổn định; chỉ chạy lại khi bật/tắt hoặc camera đổi trạng thái.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, camera.status, intervalMs])

    return { result, error, reset: () => setResult(null) }
}
