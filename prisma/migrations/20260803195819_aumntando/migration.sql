/*
  Warnings:

  - Added the required column `link_Excel` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "data_mode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "link_Excel" TEXT NOT NULL;
