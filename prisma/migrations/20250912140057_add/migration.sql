/*
  Warnings:

  - Added the required column `messages_limit` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messages_limit` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "messages_limit" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "messages_limit" INTEGER NOT NULL;
