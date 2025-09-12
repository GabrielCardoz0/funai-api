/*
  Warnings:

  - You are about to drop the column `agents_limit` on the `users` table. All the data in the column will be lost.
  - Added the required column `agents_limit` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dashboard_type` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instances_limit` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "agents_limit" INTEGER NOT NULL,
ADD COLUMN     "dashboard_type" TEXT NOT NULL,
ADD COLUMN     "instances_limit" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "agents_limit";
