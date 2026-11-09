import prisma from '../../config/db/index.js';
import { compareDates, parseDate } from '../helpers/dates.js';

const fail = (res, status, error, message) =>
    res.status(status).json({ success: false, error, message });

const toTermRow = (term) => ({
    id: term.id,
    name: term.name,
    start_date: term.startDate.toISOString().slice(0, 10),
    end_date: term.endDate.toISOString().slice(0, 10),
    session_count: term._count?.schedules ?? 0
});

const toDbDate = ({ year, month, day }) => new Date(Date.UTC(year, month - 1, day));

const readTermBody = (body) => {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const start = parseDate(body?.start_date);
    const end = parseDate(body?.end_date);

    if (!name || !start || !end) return { error: 'Provide a name, start_date, and end_date in YYYY-MM-DD format' };
    if (compareDates(start, end) > 0) return { error: 'start_date must be before end_date' };

    return { data: { name, startDate: toDbDate(start), endDate: toDbDate(end) } };
};

/** GET /api/term */
export const getTerms = async (req, res) => {
    try {
        const terms = await prisma.term.findMany({
            include: { _count: { select: { schedules: true } } },
            orderBy: { startDate: 'desc' }
        });

        return res.status(200).json({ success: true, data: terms.map(toTermRow), count: terms.length });
    } catch (error) {
        console.error('Error in getTerms:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** POST /api/term */
export const createTerm = async (req, res) => {
    try {
        const { data, error: invalid } = readTermBody(req.body);
        if (invalid) return fail(res, 400, 'ValidationError', invalid);

        const term = await prisma.term.create({ data });
        return res.status(201).json({ success: true, message: 'Term created', data: toTermRow(term) });
    } catch (error) {
        if (error.code === 'P2002') return fail(res, 409, 'DuplicateEntry', 'A term with this name already exists');
        console.error('Error in createTerm:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** PUT /api/term/:id */
export const updateTerm = async (req, res) => {
    try {
        const { data, error: invalid } = readTermBody(req.body);
        if (invalid) return fail(res, 400, 'ValidationError', invalid);

        const term = await prisma.term.update({ where: { id: Number(req.params.id) }, data });
        return res.status(200).json({ success: true, message: 'Term updated', data: toTermRow(term) });
    } catch (error) {
        if (error.code === 'P2025') return fail(res, 404, 'NotFound', 'Term not found');
        if (error.code === 'P2002') return fail(res, 409, 'DuplicateEntry', 'A term with this name already exists');
        console.error('Error in updateTerm:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** DELETE /api/term/:id — các buổi học vẫn giữ nguyên, chỉ bỏ liên kết với học kỳ. */
export const deleteTerm = async (req, res) => {
    try {
        await prisma.term.delete({ where: { id: Number(req.params.id) } });
        return res.status(200).json({ success: true, message: 'Term deleted' });
    } catch (error) {
        if (error.code === 'P2025') return fail(res, 404, 'NotFound', 'Term not found');
        console.error('Error in deleteTerm:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};
