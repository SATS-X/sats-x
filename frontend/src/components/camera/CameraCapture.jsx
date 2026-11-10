import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { LuCamera } from 'react-icons/lu'
import CameraView from './CameraView'
import useCamera from './useCamera'
import { Button } from '../ui'

const COUNTDOWN_SECONDS = 3

/** Khung chụp nhỏ gọn để nhúng vào form: đếm ngược rồi trả ảnh JPEG (data URL) qua onCapture. */
export default function CameraCapture({ onCapture, disabled = false }) {
    const camera = useCamera()
    const [countdown, setCountdown] = useState(null)
    const timerRef = useRef(null)

    useEffect(() => () => clearInterval(timerRef.current), [])

    const start = () => {
        let left = COUNTDOWN_SECONDS
        setCountdown(left)
        timerRef.current = setInterval(() => {
            left -= 1
            if (left > 0) {
                setCountdown(left)
                return
            }
            clearInterval(timerRef.current)
            setCountdown(null)
            const frame = camera.capture()
            if (frame) onCapture(frame)
        }, 1000)
    }

    return (
        <div className="space-y-2.5">
            <CameraView camera={camera} className="aspect-video w-full">
                {camera.status === 'ready' && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
                        <div className="h-[72%] aspect-[3/4] rounded-[45%] border-2 border-dashed border-white/50" />
                    </div>
                )}
                {countdown !== null && (
                    <div className="absolute inset-0 grid place-items-center bg-black/30">
                        <span className="font-data text-6xl font-semibold text-white" aria-live="assertive">
                            {countdown}
                        </span>
                    </div>
                )}
            </CameraView>
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-text-tertiary">Look straight at the camera in even light.</p>
                <Button type="button" size="sm" onClick={start} disabled={disabled || camera.status !== 'ready' || countdown !== null}>
                    <LuCamera className="h-3.5 w-3.5" aria-hidden="true" />
                    Take photo
                </Button>
            </div>
        </div>
    )
}

CameraCapture.propTypes = {
    onCapture: PropTypes.func.isRequired,
    disabled: PropTypes.bool
}
