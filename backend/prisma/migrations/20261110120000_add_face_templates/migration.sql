-- CreateTable
CREATE TABLE "face_template" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(32) NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "photo" BYTEA NOT NULL,
    "liveness_verdict" VARCHAR(16),
    "liveness_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "face_template_student_id_idx" ON "face_template"("student_id");

-- AddForeignKey
ALTER TABLE "face_template" ADD CONSTRAINT "face_template_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
