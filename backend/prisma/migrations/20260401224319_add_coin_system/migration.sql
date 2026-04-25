/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coinOptInDate" TIMESTAMP(3),
ADD COLUMN     "coinOptInEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "college" TEXT,
ADD COLUMN     "currentCoinsBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "isNewUserBonusApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginDate" TIMESTAMP(3),
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "totalCoinsEarned" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalCoinsRedeemed" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPaymentDetail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "upiNumber" TEXT,
    "upiId" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPaymentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coinsAmount" DECIMAL(65,30) NOT NULL,
    "callDurationSeconds" INTEGER,
    "callId" TEXT,
    "redemptionRequestId" TEXT,
    "isNewUserBonus" BOOLEAN NOT NULL DEFAULT false,
    "isReferralBonus" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedCoins" DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "status" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "transferDate" TIMESTAMP(3),
    "transferRefId" TEXT,
    "rejectionReason" TEXT,
    "approvedByAdminId" TEXT,

    CONSTRAINT "RedemptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarningConfig" (
    "id" TEXT NOT NULL,
    "isEarningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "disabilityMessage" TEXT,
    "dailyCoinCap" INTEGER NOT NULL DEFAULT 400,
    "lastUpdatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarningConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReferral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referredUserEarnedBonus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPaymentDetail_userId_key" ON "UserPaymentDetail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_referralCode_key" ON "UserReferral"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "UserPaymentDetail" ADD CONSTRAINT "UserPaymentDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionRequest" ADD CONSTRAINT "RedemptionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
