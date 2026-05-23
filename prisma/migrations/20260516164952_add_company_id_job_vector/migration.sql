/*
  Warnings:

  - Added the required column `company_id` to the `job_vectors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job_vectors" ADD COLUMN     "company_id" UUID NOT NULL;
