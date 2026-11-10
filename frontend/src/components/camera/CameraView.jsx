import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LuCameraOff, LuLoaderCircle, LuRefreshCw } from 'react-icons/lu'
import { cameraErrorMessage } from './useCamera'

/**
 * Khung xem trước webcam, lật như gương cho tự nhiên. Ảnh chụp (useCamera.capture)
 * cũng được lật y hệt, nên khung mặt server trả về khớp thẳng với khung xem trước.
 */
export default function CameraView({ camera, box, boxTone = 'neutral', className, children, rounded = 'rounded-xl' }) {
    const { videoRef, status, error, devices, deviceId, start, selectDevice } = camera

    return (
        <div className={classNames('relative overflow-hidden bg-black', rounded, className)}>
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" aria-label="Camera preview" />

            {box && status === 'ready' && (
                <div
                    aria-hidden="true"
                    className={classNames(
                        'pointer-events-none absolute rounded-lg border-2 transition-all duration-150',
                        boxTone === 'match' && 'border-present shadow-[0_0_0_4px_rgb(var(--color-present)/0.25)]',
                        boxTone === 'warn' && 'border-late',
                        boxTone === 'neutral' && 'border-white/80'
                    )}
                    style={{
                        left: `${box.left * 100}%`,
                        top: `${box.top * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`
                    }}
                />
            )}

            {status === 'starting' && (
                <div className="absolute inset-0 grid place-items-center text-sm text-white/80">
                    <span className="inline-flex items-center gap-2">
                        <LuLoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Starting camera…
                    </span>
                </div>
            )}

            {status === 'error' && (
                <div role="alert" className="absolute inset-0 grid place-items-center p-6 text-center">
                    <div className="max-w-xs space-y-3 text-white">
                        <LuCameraOff className="mx-auto h-7 w-7 text-white/70" aria-hidden="true" />
                        <p className="text-sm leading-6">{cameraErrorMessage(error)}</p>
                        {error !== 'insecure' && error !== 'unsupported' && (
                            <button
                                type="button"
                                onClick={() => start()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black"
                            >
                                <LuRefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                Try again
                            </button>
                        )}
                    </div>
                </div>
            )}

            {devices.length > 1 && status !== 'error' && (
                <select
                    aria-label="Camera"
                    value={deviceId}
                    onChange={(e) => selectDevice(e.target.value)}
                    className="absolute right-2 top-2 max-w-[60%] truncate rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur"
                >
                    {devices.map((d, i) => (
                        <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${i + 1}`}
                        </option>
                    ))}
                </select>
            )}

            {children}
        </div>
    )
}

CameraView.propTypes = {
    camera: PropTypes.object.isRequired,
    box: PropTypes.shape({ left: PropTypes.number, top: PropTypes.number, width: PropTypes.number, height: PropTypes.number }),
    boxTone: PropTypes.oneOf(['neutral', 'match', 'warn']),
    className: PropTypes.string,
    rounded: PropTypes.string,
    children: PropTypes.node
}
