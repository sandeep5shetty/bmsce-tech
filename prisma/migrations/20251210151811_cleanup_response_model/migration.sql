/*
  Warnings:

  - You are about to drop the column `name` on the `Response` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Response` table. All the data in the column will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_studentId_fkey";

-- DropIndex
DROP INDEX "Response_studentId_idx";

-- AlterTable
ALTER TABLE "Response" DROP COLUMN "name",
DROP COLUMN "studentId";

-- DropTable
DROP TABLE "Student";
