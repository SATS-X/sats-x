/** Khoá ảnh đăng ký khuôn mặt trên S3. Bucket là private nên phải xin URL ký để hiển thị. */
export const getStudentPhotoKey = (classId, studentId) => `classes/${classId}/${studentId}.jpg`
