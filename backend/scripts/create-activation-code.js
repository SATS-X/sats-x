/**
 * Cấp mã kích hoạt dùng một lần cho giáo viên chưa đặt mật khẩu.
 * Admin chuyển mã cho đúng người đó qua kênh riêng; cấp mã mới sẽ vô hiệu mã cũ.
 *
 *   node scripts/create-activation-code.js <email> [hours]
 *
 * Ví dụ:
 *   node scripts/create-activation-code.js invited@satsx.dev 72
 */
import crypto from 'crypto';
import prisma from '../src/config/db/index.js';
import { hashToken } from '../src/config/auth.js';

const DEFAULT_TTL_HOURS = 72;

const [email, hoursArg] = process.argv.slice(2);
const hours = hoursArg === undefined ? DEFAULT_TTL_HOURS : Number(hoursArg);

if (!email || !Number.isFinite(hours) || hours <= 0) {
    console.error('Usage: node scripts/create-activation-code.js <email> [hours]');
    process.exit(1);
}

try {
    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const { count } = await prisma.teacher.updateMany({
        where: { email, passwordHash: null, isActive: true },
        data: { activationCodeHash: hashToken(code), activationCodeExpiresAt: expiresAt }
    });

    if (count !== 1) {
        console.error(`No active teacher without a password was found for ${email}.`);
        await prisma.$disconnect();
        process.exit(1);
    }

    console.log(`Activation code for ${email}: ${code}`);
    console.log(`Expires at: ${expiresAt.toISOString()}`);
    await prisma.$disconnect();
    process.exit(0);
} catch (error) {
    console.error('Activation code creation failed:', error.message);
    process.exit(1);
}
