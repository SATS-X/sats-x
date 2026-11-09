/** Lấy thông báo lỗi người dùng đọc được từ response của backend. */
export const apiErrorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback
