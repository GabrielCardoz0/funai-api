/*
  Warnings:

  - Added the required column `plan_name` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "plan_name" TEXT NOT NULL;
