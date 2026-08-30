/**
 * Nén ảnh phía client trước khi đưa lên AWS.
 *
 * Hai đích đến có ràng buộc rất khác nhau:
 *  - Qua S3 presigned URL: thoải mái, chỉ cần đủ nhỏ để upload nhanh.
 *  - Nhúng base64 vào frame WebSocket: API Gateway đóng kết nối (code 1009) với
 *    bất kỳ frame nào > 32KB, và trình duyệt KHÔNG tự chia nhỏ frame — mỗi lần
 *    send() là đúng một frame. Xem quota "WebSocket frame size 32 KB" của AWS.
 */

const DIMENSION_LADDER = [1600, 1280, 1024, 800, 640, 480, 360, 240]

const loadImage = (file) =>
    new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(img)
        }
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Unable to read the image'))
        }
        img.src = objectUrl
    })

const drawAt = (img, maxDimension) => {
    let { width, height } = img
    if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width)
        width = maxDimension
    } else if (height >= width && height > maxDimension) {
        width = Math.round((width * maxDimension) / height)
        height = maxDimension
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    return canvas
}

export const dataUrlToBlob = (dataUrl) => {
    const [header, encoded] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mime })
}

/**
 * @param {File|Blob} file
 * @param {{maxDimension?: number, maxBase64Length?: number, initialQuality?: number, minQuality?: number}} options
 * @returns {Promise<{dataUrl: string, base64: string, blob: Blob, withinBudget: boolean}>}
 */
export const compressImage = async (
    file,
    { maxDimension = 1280, maxBase64Length = Infinity, initialQuality = 0.9, minQuality = 0.3 } = {}
) => {
    const img = await loadImage(file)

    // Ảnh nhiều chi tiết (nền gỗ, cây, đèn...) có thể không nén đủ nhỏ chỉ bằng
    // cách hạ quality — phải hạ dần CẢ kích thước mới chắc chắn hội tụ dưới ngưỡng.
    const ladder = DIMENSION_LADDER.filter((d) => d <= maxDimension)
    if (ladder[0] !== maxDimension) ladder.unshift(maxDimension)

    let dataUrl = ''
    for (const dimension of ladder) {
        const canvas = drawAt(img, dimension)
        let quality = initialQuality
        dataUrl = canvas.toDataURL('image/jpeg', quality)
        while (dataUrl.length > maxBase64Length && quality > minQuality) {
            quality -= 0.15
            dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        if (dataUrl.length <= maxBase64Length) break
    }

    return {
        dataUrl,
        base64: dataUrl.split(',')[1] || '',
        blob: dataUrlToBlob(dataUrl),
        withinBudget: dataUrl.length <= maxBase64Length
    }
}

const imageDimensions = async (file) => {
    const img = await loadImage(file)
    return { width: img.naturalWidth, height: img.naturalHeight }
}

/**
 * Chuẩn bị ảnh để PUT lên S3.
 *
 * Ảnh JPEG được đẩy lên NGUYÊN VẸN từng byte, không vẽ lại qua canvas. Lý do
 * không chỉ là chất lượng: canvas xuất JPEG luôn vứt bỏ ICC profile, nên ảnh
 * chụp bằng máy ảnh/điện thoại (Display P3, Adobe RGB, HDR gain map) sau khi
 * mã hoá lại sẽ bị nhạt màu và bệt tương phản so với ảnh gốc. Đi thẳng lên S3
 * thì không có khâu giải mã màu nào để mà sai.
 *
 * Rekognition đọc được JPEG/PNG tới 15MB nên ngưỡng ở đây chỉ để upload không
 * quá chậm; các định dạng khác (WebP, HEIC...) vẫn phải chuyển sang JPEG.
 *
 * @returns {Promise<{blob: Blob, reencoded: boolean, width?: number, height?: number}>}
 */
export const prepareImageForUpload = async (file, { maxDimension = 4096, maxBytes = 5 * 1024 * 1024 } = {}) => {
    if (file.type === 'image/jpeg' && file.size <= maxBytes) {
        const { width, height } = await imageDimensions(file)
        if (Math.max(width, height) <= maxDimension) {
            return { blob: file, reencoded: false, width, height }
        }
    }

    const { blob } = await compressImage(file, {
        maxDimension: Math.min(maxDimension, 1600),
        maxBase64Length: Math.round((maxBytes * 4) / 3)
    })
    return { blob, reencoded: true }
}

export default { compressImage, dataUrlToBlob, prepareImageForUpload }
