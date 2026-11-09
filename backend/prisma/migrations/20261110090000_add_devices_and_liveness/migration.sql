-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "device_id" VARCHAR(64),
ADD COLUMN     "liveness_score" DOUBLE PRECISION,
ADD COLUMN     "liveness_verdict" VARCHAR(16);

-- CreateTable
CREATE TABLE "device" (
    "device_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100),
    "room" VARCHAR(64),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "firmware_version" VARCHAR(32),
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("device_id")
);

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
