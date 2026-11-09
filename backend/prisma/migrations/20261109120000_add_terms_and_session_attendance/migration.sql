-- CreateTable
CREATE TABLE "term" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "term_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "schedule" ADD COLUMN     "series_id" VARCHAR(36),
ADD COLUMN     "term_id" INTEGER;

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "schedule_id" INTEGER;

-- Ghép bản ghi cũ vào buổi học cùng môn, cùng ngày. Bản ghi trùng giữ schedule_id
-- NULL thay vì bị xoá, để không mất dữ liệu lịch sử.
WITH matched AS (
    SELECT a.id,
           m.schedule_id,
           ROW_NUMBER() OVER (PARTITION BY a.student_id, m.schedule_id ORDER BY a.id) AS rn
    FROM "attendance" a
    CROSS JOIN LATERAL (
        SELECT s.id AS schedule_id
        FROM "schedule" s
        WHERE s.subject_id = a.subject_id
          AND s.day = a.day
          AND s.month = a.month
          AND s.year = a.year
        ORDER BY (a.time BETWEEN s.start_time AND s.end_time) DESC, s.start_time ASC
        LIMIT 1
    ) m
)
UPDATE "attendance" a
SET schedule_id = matched.schedule_id
FROM matched
WHERE a.id = matched.id AND matched.rn = 1;

-- Buổi đã qua được đóng ngay, để việc tự ghi vắng chỉ áp dụng từ thời điểm này trở đi.
UPDATE "schedule"
SET status = 'completed'
WHERE status = 'scheduled'
  AND make_timestamp(
        year,
        month,
        day,
        split_part(end_time, ':', 1)::int,
        split_part(end_time, ':', 2)::int,
        0
      ) < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

-- CreateIndex
CREATE UNIQUE INDEX "term_name_key" ON "term"("name");

-- CreateIndex
CREATE INDEX "schedule_term_id_idx" ON "schedule"("term_id");

-- CreateIndex
CREATE INDEX "schedule_series_id_idx" ON "schedule"("series_id");

-- CreateIndex
CREATE INDEX "attendance_schedule_id_idx" ON "attendance"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_student_id_schedule_id_key" ON "attendance"("student_id", "schedule_id");

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
