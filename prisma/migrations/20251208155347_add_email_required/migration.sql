/*
  Warnings:

  - Made the column `email` on table `Response` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Response" ALTER COLUMN "email" SET NOT NULL;
