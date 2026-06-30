-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('SPELLING', 'WRONG_ANSWER', 'UNCLEAR', 'OTHER');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "category" "ReportCategory" NOT NULL DEFAULT 'OTHER';
