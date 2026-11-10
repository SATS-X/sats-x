import { FACE_PROVIDER } from '../config/api'
import FaceManagementCloud from './FaceManagementCloud'
import FaceManagementLocal from './FaceManagementLocal'

/** 'local' nhận diện ngay trên máy này; 'aws' dùng Rekognition qua WebSocket API. */
export default function FaceManagement() {
    return FACE_PROVIDER === 'aws' ? <FaceManagementCloud /> : <FaceManagementLocal />
}
