CREATE EXTENSION IF NOT EXISTS vector;
-- CreateTable
CREATE TABLE "resume_vectors" (
    "id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_vectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_vectors" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_vectors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_vectors_resume_id_idx" ON "resume_vectors"("resume_id");

-- CreateIndex
CREATE INDEX "job_vectors_job_id_idx" ON "job_vectors"("job_id");

-- AddForeignKey
ALTER TABLE "resume_vectors" ADD CONSTRAINT "resume_vectors_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vectors" ADD CONSTRAINT "job_vectors_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
