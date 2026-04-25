/*
  Warnings:

  - You are about to drop the column `dailyCoinCap` on the `EarningConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EarningConfig" DROP COLUMN "dailyCoinCap",
ADD COLUMN     "femaleCoinsAmount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "femaleConversionTimeSeconds" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "maleCoinsAmount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maleConversionTimeSeconds" INTEGER NOT NULL DEFAULT 120;
