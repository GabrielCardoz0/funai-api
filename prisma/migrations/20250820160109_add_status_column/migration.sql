/*
  Warnings:

  - Added the required column `image` to the `agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "canceled_at" TIMESTAMP(6),
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "image" TEXT;
