/*
  Warnings:

  - Added the required column `business_description` to the `agents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agents_limit` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dashboard_type` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instances_limit` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "business_description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "agents_limit" INTEGER NOT NULL,
ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dashboard_type" TEXT NOT NULL,
ADD COLUMN     "instances_limit" INTEGER NOT NULL;
