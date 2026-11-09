const VN_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
});

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WEEKDAY_NAMES = WEEKDAYS;

/**
 * Trả về ngày/giờ theo múi giờ VN cho một thời điểm UTC bất kỳ — dùng
 * Intl.DateTimeFormat thay vì tự cộng/trừ 7 tiếng vào epoch, vì phép cộng thủ
 * công dễ cộng nhầm lần hai nếu Date đã được parse từ chuỗi ISO có "+07:00".
 */
export const toVietnamParts = (date) => {
    const parts = Object.fromEntries(VN_FORMATTER.formatToParts(date).map((p) => [p.type, p.value]));
    return {
        day: Number(parts.day),
        month: Number(parts.month),
        year: Number(parts.year),
        time: `${parts.hour}:${parts.minute}`
    };
};

export const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

export const isValidTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** Phân tích "YYYY-MM-DD" thành { year, month, day }, trả null nếu không phải ngày có thật. */
export const parseDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return { year, month, day };
};

export const formatDate = ({ year, month, day }) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const weekdayOf = ({ year, month, day }) => WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

const dateOrdinal = ({ year, month, day }) => Date.UTC(year, month - 1, day);

export const compareDates = (a, b) => dateOrdinal(a) - dateOrdinal(b);

/** Liệt kê mọi ngày trong khoảng, gồm cả hai đầu. Trả null nếu khoảng dài hơn maxDays. */
export const enumerateDates = (from, to, maxDays) => {
    const count = Math.floor((dateOrdinal(to) - dateOrdinal(from)) / 86400000) + 1;
    if (count <= 0 || count > maxDays) return null;

    return Array.from({ length: count }, (_, index) => {
        const date = new Date(dateOrdinal(from) + index * 86400000);
        return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
    });
};

/** Điều kiện Prisma cho khoảng ngày vì ngày đang lưu thành ba cột số. */
export const dateRangeFilter = (query, maxDays = 366) => {
    if (!query?.from && !query?.to) return { filter: {} };

    const from = parseDate(query.from || query.to);
    const to = parseDate(query.to || query.from);
    if (!from || !to) return { error: 'from and to must use the YYYY-MM-DD format' };

    const dates = enumerateDates(from, to, maxDays);
    if (!dates) return { error: `The date range must be valid and at most ${maxDays} days` };

    return { filter: { OR: dates } };
};
