import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { sendOtpEmail, sendRegistrationReceivedEmail } from '../services/emailService.js';
import { uploadIdCard } from '../services/supabaseService.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// Route 1: /api/auth/register-request - Submit a new user registration request
router.post('/register-request', upload.single('idCardPhoto'), async (req, res) => {
  try {
    const { enrollment_no, name, email, phone_no, gender, college, upiId } = req.body;
    
    if (!enrollment_no || !name || !email || !phone_no || !gender || !college) {
      return res.status(400).json({ error: 'All fields except UPI ID are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a clear front photo of your college ID.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { enrollment_no },
          { email },
          { phone_no }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this Enrollment No., Email, or Phone No. is already registered.' });
    }

    // Check if a pending request already exists
    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        OR: [
          { enrollment_no },
          { email },
          { phone_no }
        ],
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending registration request.' });
    }

    // Upload ID to Supabase
    const idCardPhotoUrl = await uploadIdCard(req.file.buffer, req.file.originalname, req.file.mimetype);

    // Save Request
    const request = await prisma.registrationRequest.create({
      data: {
        enrollment_no,
        name,
        email,
        phone_no,
        gender,
        college,
        upiId: upiId || null,
        idCardPhotoUrl
      }
    });

    // Send email
    await sendRegistrationReceivedEmail(name, email);

    res.status(201).json({ message: 'Your request has been submitted and you will receive a mail after verification by our admin.' });
  } catch (error) {
    console.error('Registration request error:', error);
    res.status(500).json({ error: 'Failed to submit registration request.' });
  }
});

// Route 2: /api/auth/login - Find user and send OTP
router.post('/login', async (req, res) => {
  const { enrollment_no } = req.body;
  if (!enrollment_no) {
    return res.status(400).json({ error: 'Enrollment number is required.' });
  }

  let user = await prisma.user.findUnique({ where: { enrollment_no } });

  if (!user) {
    if (enrollment_no === '1111') {
      user = await prisma.user.create({
        data: {
          enrollment_no: '1111',
          name: 'Pratham Garg',
          email: 'pratham.garg2801@gmail.com',
          phone_no: '0000000000',
          gender: 'Male',
          isAdmin: true,
        }
      });
    } else {
      return res.status(404).json({ error: 'User not found. Please register this user via the admin panel.' });
    }
  }

  if (user.status === 'BANNED' || user.status === 'FROZEN') {
    return res.status(403).json({ error: `Your account is currently ${user.status}. Please contact support.` });
  }

  let otp;
  // if (['1111', '0001', '0002'].includes(enrollment_no)) {
  //   otp = '0001';
  // } else {
  otp = Math.floor(100000 + Math.random() * 900000).toString();
  // }
  const otp_expiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { login_otp: otp, otp_expiry },
  });

  try {
    await sendOtpEmail(user.email, otp);
    const [emailUser, emailDomain] = user.email.split('@');
    const maskedEmail = `${emailUser.substring(0, 1)}***@${emailDomain}`;

    res.status(200).json({
      message: `OTP sent successfully.`,
      user: {
        name: user.name,
        email: maskedEmail
      }
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

// Route 2: /api/auth/verify - Verify OTP and generate JWT
router.post('/verify', async (req, res) => {
  const { enrollment_no, otp } = req.body;
  if (!enrollment_no || !otp) {
    return res.status(400).json({ error: 'Enrollment number and OTP are required.' });
  }

  const user = await prisma.user.findUnique({ where: { enrollment_no } });

  if (!user || user.login_otp !== otp || new Date() > user.otp_expiry) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { login_otp: null, otp_expiry: null },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({
    token,
    user: {
      id: user.id,
      fake_name: user.fake_name,
      isAdmin: user.isAdmin
    }
  });
});

// GET /api/auth/me - Get current user data from token for session persistence
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fake_name: true,
        isAdmin: true,
        status: true,
        currentCoinsBalance: true,
        isNewUserBonusApplied: true,
      }
    });
    if (user) {
      if (user.status === 'BANNED' || user.status === 'FROZEN') {
        return res.status(403).json({ error: `Your account is ${user.status}.` })
      }

      // Removed automatic new user bonus award logic here.
      // Bonus must now be claimed manually via /api/coins/claim-login-bonus
      
      let loginBonusClaimStatus = null;
      try {
        const claim = await prisma.loginBonusClaim.findFirst({
          where: { userId: req.user.id },
          orderBy: { claimedAt: 'desc' }
        });
        loginBonusClaimStatus = claim ? {
          status: claim.status,
          rejectionReason: claim.rejectionReason,
          bonusAmount: claim.bonusAmount
        } : null;
      } catch (err) {
        console.error("Error fetching login bonus claim:", err);
      }

      res.status(200).json({
        ...user,
        loginBonusClaimStatus,
        newUserBonusAwarded: false, // Legacy field
        bonusCoins: 0, // Legacy field
      });
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Route 3: /api/auth/setup - Set the user's fake name and college
router.post('/setup', protect, async (req, res) => {
  const { fake_name, college } = req.body;
  const userId = req.user.id;

  if (!fake_name || fake_name.length < 3) {
    return res.status(400).json({ error: 'Alias must be at least 3 characters long.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { fake_name } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'This alias is already taken. Please choose another.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fake_name, college },
    });

    res.status(200).json({ message: 'Profile setup complete!', user: { fake_name: updatedUser.fake_name } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during profile setup.' });
  }
});

export default router;

