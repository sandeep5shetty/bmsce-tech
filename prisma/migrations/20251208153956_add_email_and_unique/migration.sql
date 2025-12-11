/*
  Warnings:

  - A unique constraint covering the columns `[questionId,email]` on the table `Response` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Response_questionId_email_key" ON "Response"("questionId", "email");
