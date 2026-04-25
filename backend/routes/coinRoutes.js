import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Middleware to verify JWT token
const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to get today's coin earnings
const getTodaysCoinEarnings = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTransactions = await prisma.coinTransaction.findMany({
    where: {
      userId,
      type: 'EARNED_CALL',
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return todayTransactions.reduce((sum, tx) => sum + parseFloat(tx.coinsAmount), 0);
};

// Insecure /award endpoint removed. Coins are awarded via the secure Socket connection upon chat termination.


// GET /api/coins/earning-config - Get earning status (public)
router.get('/earning-config', async (req, res) => {
  try {
    const earningConfig = await prisma.earningConfig.findFirst();
    res.json({
      isEarningEnabled: earningConfig?.isEarningEnabled ?? true,
      disabilityMessage: earningConfig?.disabilityMessage,
      femaleCoinsAmount: earningConfig?.femaleCoinsAmount ?? 1,
      femaleConversionTimeSeconds: earningConfig?.femaleConversionTimeSeconds ?? 60,
      maleCoinsAmount: earningConfig?.maleCoinsAmount ?? 1,
      maleConversionTimeSeconds: earningConfig?.maleConversionTimeSeconds ?? 120,
    });
  } catch (error) {
    console.error('Earning config error:', error);
    res.status(500).json({ error: 'Failed to fetch earning config' });
  }
});

// POST /api/coins/opt-in - Set up earning with payment details
router.post('/opt-in', protect, async (req, res) => {
  try {
    const { paymentMethod, upiNumber, upiId, accountNumber, ifscCode } = req.body;
    const userId = req.user.id;

    // Validation
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    if (paymentMethod === 'UPI_NUMBER' && !upiNumber) {
      return res.status(400).json({ error: 'UPI number required' });
    }
    if (paymentMethod === 'UPI_ID' && !upiId) {
      return res.status(400).json({ error: 'UPI ID required' });
    }
    if (paymentMethod === 'BANK_ACCOUNT' && (!accountNumber || !ifscCode)) {
      return res.status(400).json({ error: 'Account number and IFSC code required' });
    }

    // Create or update payment detail
    const paymentDetail = await prisma.userPaymentDetail.upsert({
      where: { userId },
      update: {
        paymentMethod,
        upiNumber: paymentMethod === 'UPI_NUMBER' ? upiNumber : null,
        upiId: paymentMethod === 'UPI_ID' ? upiId : null,
        accountNumber: paymentMethod === 'BANK_ACCOUNT' ? accountNumber : null,
        ifscCode: paymentMethod === 'BANK_ACCOUNT' ? ifscCode : null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        paymentMethod,
        upiNumber: paymentMethod === 'UPI_NUMBER' ? upiNumber : null,
        upiId: paymentMethod === 'UPI_ID' ? upiId : null,
        accountNumber: paymentMethod === 'BANK_ACCOUNT' ? accountNumber : null,
        ifscCode: paymentMethod === 'BANK_ACCOUNT' ? ifscCode : null,
      },
    });

    // Enable coin opt-in for user
    await prisma.user.update({
      where: { id: userId },
      data: {
        coinOptInEnabled: true,
        coinOptInDate: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Coin earning enabled! You can start earning coins.',
      paymentDetail: {
        paymentMethod,
        maskedDetails: maskPaymentDetails(paymentMethod, { upiNumber, upiId, accountNumber }),
      },
    });
  } catch (error) {
    console.error('Opt-in error:', error);
    res.status(500).json({ error: 'Failed to set up coin earning' });
  }
});

// PUT /api/coins/payment-detail - Update payment details
router.put('/payment-detail', protect, async (req, res) => {
  try {
    const { paymentMethod, upiNumber, upiId, accountNumber, ifscCode } = req.body;
    const userId = req.user.id;

    const paymentDetail = await prisma.userPaymentDetail.update({
      where: { userId },
      data: {
        paymentMethod,
        upiNumber: paymentMethod === 'UPI_NUMBER' ? upiNumber : null,
        upiId: paymentMethod === 'UPI_ID' ? upiId : null,
        accountNumber: paymentMethod === 'BANK_ACCOUNT' ? accountNumber : null,
        ifscCode: paymentMethod === 'BANK_ACCOUNT' ? ifscCode : null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Payment method updated',
      paymentDetail,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment details' });
  }
});

// GET /api/coins/balance - Get current coin balance
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { paymentDetail: true },
    });

    const todayEarnings = await getTodaysCoinEarnings(req.user.id);

    // Get login bonus claim status
    const loginBonusClaim = await prisma.loginBonusClaim.findFirst({
      where: { userId: req.user.id },
      orderBy: { claimedAt: 'desc' },
    });

    // Determine user's specific earning rate
    const earningConfig = await prisma.earningConfig.findFirst();
    let coinsPerInterval = earningConfig?.maleCoinsAmount || 1;
    let intervalSeconds = earningConfig?.maleConversionTimeSeconds || 120;
    if (user.gender && user.gender.toLowerCase() === 'f') {
        coinsPerInterval = earningConfig?.femaleCoinsAmount || 1;
        intervalSeconds = earningConfig?.femaleConversionTimeSeconds || 60;
    }

    res.json({
      currentBalance: user.currentCoinsBalance,
      totalEarned: user.totalCoinsEarned,
      totalSpent: user.totalCoinsRedeemed,
      coinOptInEnabled: user.coinOptInEnabled,
      userEarningRate: {
          coins: coinsPerInterval,
          minutes: intervalSeconds / 60
      },
      paymentDetail: user.paymentDetail
        ? {
            paymentMethod: user.paymentDetail.paymentMethod,
            maskedDetails: maskPaymentDetails(user.paymentDetail.paymentMethod, {
              upiNumber: user.paymentDetail.upiNumber,
              upiId: user.paymentDetail.upiId,
              accountNumber: user.paymentDetail.accountNumber,
            }),
          }
        : null,
      todayEarnings,
      remainingTodayEarnings: Math.max(0, 400 - todayEarnings),
      loginBonusStatus: loginBonusClaim ? {
        hasClaim: true,
        claimId: loginBonusClaim.id,
        status: loginBonusClaim.status,
        bonusAmount: loginBonusClaim.bonusAmount,
        claimedAt: loginBonusClaim.claimedAt,
        approvedAt: loginBonusClaim.approvedAt,
      } : {
        hasClaim: false,
        status: 'NO_CLAIM',
      },
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// GET /api/coins/transaction-history - View call history
router.get('/transaction-history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(type && { type }),
    };

    const transactions = await prisma.coinTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.coinTransaction.count({ where });

    res.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        date: tx.createdAt,
        type: tx.type,
        coins: tx.coinsAmount,
        duration: tx.callDurationSeconds,
        reason: tx.reason,
      })),
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// POST /api/coins/redemption-request - Submit withdrawal request
router.post('/redemption-request', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Validation: Must have exactly 1000 coins
    if (user.currentCoinsBalance < 1000) {
      return res.status(400).json({
        error: 'Insufficient coins. Minimum 1000 coins required.',
        currentBalance: user.currentCoinsBalance,
        coinsNeeded: 1000 - user.currentCoinsBalance,
      });
    }

    // Must have payment detail
    const paymentDetail = await prisma.userPaymentDetail.findUnique({ where: { userId } });
    if (!paymentDetail) {
      return res.status(400).json({ error: 'Payment details required. Please add payment method first.' });
    }

    // Create redemption request
    const redemptionRequest = await prisma.redemptionRequest.create({
      data: {
        userId,
        requestedCoins: 1000,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      requestId: redemptionRequest.id,
      status: 'PENDING',
      submittedDate: redemptionRequest.requestDate,
      coinsRequested: 1000,
      rupeeAmount: 500,
      message: 'Redemption request submitted. Admin will review and transfer funds soon.',
    });
  } catch (error) {
    console.error('Redemption request error:', error);
    res.status(500).json({ error: 'Failed to submit redemption request' });
  }
});

// GET /api/coins/redemption-requests - View user's redemption requests
router.get('/redemption-requests', protect, async (req, res) => {
  try {
    const requests = await prisma.redemptionRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { requestDate: 'desc' },
    });

    res.json({
      requests: requests.map((req) => ({
        id: req.id,
        coins: req.requestedCoins,
        rupees: req.requestedCoins / 2,
        status: req.status,
        requestDate: req.requestDate,
        approvalDate: req.approvedDate,
        transferRef: req.transferRefId,
        rejectionReason: req.rejectionReason,
      })),
    });
  } catch (error) {
    console.error('Redemption requests error:', error);
    res.status(500).json({ error: 'Failed to fetch redemption requests' });
  }
});

// Helper function to mask payment details
function maskPaymentDetails(paymentMethod, details) {
  if (paymentMethod === 'UPI_NUMBER') {
    return details.upiNumber ? details.upiNumber.slice(0, 4) + '****' : 'Not provided';
  } else if (paymentMethod === 'UPI_ID') {
    return details.upiId ? details.upiId.split('@')[0].slice(0, 3) + '****@' + details.upiId.split('@')[1] : 'Not provided';
  } else if (paymentMethod === 'BANK_ACCOUNT') {
    return details.accountNumber ? 'Account: ****' + details.accountNumber.slice(-4) : 'Not provided';
  }
  return 'Not provided';
}

// GET /api/coins/referral-code - Get user's referral code
router.get('/referral-code', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.referralCode) {
      return res.status(404).json({ error: 'No referral code generated' });
    }

    res.json({ referralCode: user.referralCode });
  } catch (error) {
    console.error('Referral code fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch referral code' });
  }
});

// POST /api/coins/redeem-login-bonus - Redeem the 50 rupee login bonus
router.post('/redeem-login-bonus', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already claimed
    if (user.isNewUserBonusApplied) {
      return res.status(400).json({ error: 'Login bonus already claimed' });
    }

    // Award 100 coins (50 rupees = 100 coins, since 2 coins = 1 rupee)
    const bonusCoins = 100;

    // Create transaction
    await prisma.coinTransaction.create({
      data: {
        userId,
        type: 'NEW_USER_BONUS',
        coinsAmount: bonusCoins,
        isNewUserBonus: true,
      },
    });

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentCoinsBalance: user.currentCoinsBalance + bonusCoins,
        totalCoinsEarned: user.totalCoinsEarned + bonusCoins,
        isNewUserBonusApplied: true,
      },
    });

    res.json({
      success: true,
      message: 'Login bonus claimed successfully!',
      coinsAdded: bonusCoins,
      newBalance: updatedUser.currentCoinsBalance,
    });
  } catch (error) {
    console.error('Login bonus redemption error:', error);
    res.status(500).json({ error: 'Failed to redeem login bonus' });
  }
});

// POST /api/coins/claim-login-bonus - User submits login bonus claim with payment details
router.post('/claim-login-bonus', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, upiNumber, upiId, accountNumber, ifscCode } = req.body;

    // Validation
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    if (paymentMethod === 'UPI_NUMBER' && !upiNumber) {
      return res.status(400).json({ error: 'UPI number required' });
    }
    if (paymentMethod === 'UPI_ID' && !upiId) {
      return res.status(400).json({ error: 'UPI ID required' });
    }
    if (paymentMethod === 'BANK_ACCOUNT' && (!accountNumber || !ifscCode)) {
      return res.status(400).json({ error: 'Account number and IFSC code required' });
    }

    // Check if user already has a pending or approved claim
    const existingClaim = await prisma.loginBonusClaim.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingClaim) {
      return res.status(400).json({
        error: 'You already have a pending or approved login bonus claim',
        existingClaimId: existingClaim.id,
        existingClaimStatus: existingClaim.status,
      });
    }

    // Create login bonus claim
    const claim = await prisma.loginBonusClaim.create({
      data: {
        userId,
        status: 'PENDING',
        bonusAmount: 100,
        paymentMethod,
        upiNumber: paymentMethod === 'UPI_NUMBER' ? upiNumber : null,
        upiId: paymentMethod === 'UPI_ID' ? upiId : null,
        accountNumber: paymentMethod === 'BANK_ACCOUNT' ? accountNumber : null,
        ifscCode: paymentMethod === 'BANK_ACCOUNT' ? ifscCode : null,
      },
    });

    res.json({
      success: true,
      claimId: claim.id,
      status: 'PENDING',
      message: '✅ Login bonus claim submitted! The admin will review and approve your claim shortly.',
      bonusAmount: claim.bonusAmount,
      paymentMethod: claim.paymentMethod,
    });
  } catch (error) {
    console.error('Claim login bonus error:', error);
    res.status(500).json({ error: 'Failed to submit login bonus claim' });
  }
});

// GET /api/coins/login-bonus-claim - Get user's login bonus claim status
router.get('/login-bonus-claim', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get most recent claim
    const claim = await prisma.loginBonusClaim.findFirst({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
    });

    if (!claim) {
      return res.json({
        hasClaim: false,
        message: 'No login bonus claim found',
      });
    }

    res.json({
      hasClaim: true,
      claimId: claim.id,
      status: claim.status,
      bonusAmount: claim.bonusAmount,
      claimedAt: claim.claimedAt,
      approvedAt: claim.approvedAt,
      paymentMethod: claim.paymentMethod,
      paymentDetails: maskPaymentDetails(claim.paymentMethod, {
        upiNumber: claim.upiNumber,
        upiId: claim.upiId,
        accountNumber: claim.accountNumber,
      }),
      rejectionReason: claim.rejectionReason,
    });
  } catch (error) {
    console.error('Get login bonus claim error:', error);
    res.status(500).json({ error: 'Failed to fetch login bonus claim' });
  }
});

export default router;

