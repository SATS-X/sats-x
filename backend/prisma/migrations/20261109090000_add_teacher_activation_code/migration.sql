-- AlterTable
ALTER TABLE "teacher" ADD COLUMN     "activation_code_expires_at" TIMESTAMP(3),
ADD COLUMN     "activation_code_hash" CHAR(64);
