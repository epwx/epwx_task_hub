import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  registerPartner,
  createPartnerReferral,
  getReferralByCode,
  getPartnerStats,
  getPartnerEarningsHistory,
  getAllPartners,
  getPendingPartners,
  approvePartner,
  rejectPartner
} from '../services/partnerService.js';
import { Partner, User } from '../models/index.js';

const uploadDir = path.join(process.cwd(), 'uploads/partner-verification');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) { cb(null, true); } else { cb(new Error('Only image files are allowed')); }
  }
});

const router = express.Router();

function getAdminWallets() {
  return (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
}
function isAdminWallet(wallet) {
  if (!wallet) return false;
  return getAdminWallets().includes(String(wallet).toLowerCase());
}

router.post('/register', upload.single('verificationImage'), async (req, res) => {
  try {
    const { name, walletAddress, telegramChannel, xProfile } = req.body;
    if (!name || !walletAddress) return res.status(400).json({ success: false, message: 'Name and wallet address are required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Twitter followers screenshot is required for verification' });
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format. Must be 0x followed by 40 hex characters.' });
    }
    
    const verificationImagePath = path.relative(process.cwd(), req.file.path);
    const partner = await registerPartner({ name, walletAddress, telegramChannel, xProfile, verificationImagePath });
    res.json({ success: true, message: 'Partner registered successfully. Awaiting admin verification.', partner: { id: partner.id, name: partner.name, walletAddress: partner.walletAddress, status: partner.status, totalEarnings: partner.totalEarnings } });
  } catch (error) {
    console.error('Partner registration error:', error);
    // Extract meaningful error message
    const message = error?.message || 'Failed to register partner';
    res.status(400).json({ success: false, message });
  }
});

router.get('/admin/pending', async (req, res) => {
  try {
    const adminWallet = req.headers['x-admin-wallet']?.toString().toLowerCase();
    if (!isAdminWallet(adminWallet)) return res.status(403).json({ success: false, message: 'Only admins can view pending partners' });
    const pendingPartners = await getPendingPartners();
    res.json({ success: true, partners: pendingPartners.map(p => ({ id: p.id, name: p.name, walletAddress: p.walletAddress, status: p.status, verificationImagePath: p.verificationImagePath, telegramChannel: p.telegramChannel, xProfile: p.xProfile, createdAt: p.createdAt })) });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/referral/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const referral = await getReferralByCode(code);
    if (!referral) return res.status(404).json({ success: false, message: 'Referral not found' });
    res.json({ success: true, referral: { id: referral.id, partnerId: referral.partnerId, partnerName: referral.partner?.name, userId: referral.userId, referralCode: referral.referralCode, totalClaimsEarned: referral.totalClaimsEarned } });
  } catch (error) {
    console.error('Get referral error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const partners = await getAllPartners(status);
    res.json({ success: true, partners });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:partnerId/generate-link', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { userId, walletAddress } = req.body || {};

    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const partner = await Partner.findByPk(partnerId, {
        attributes: ['id', 'walletAddress']
      });

      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner not found' });
      }

      const lookupWallet = (walletAddress || partner.walletAddress || '').toLowerCase();
      if (!lookupWallet) {
        return res.status(400).json({ success: false, message: 'Unable to resolve wallet for referral link generation' });
      }

      const user = await User.findOne({
        where: { walletAddress: lookupWallet },
        attributes: ['id']
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'No user account found for this wallet. Complete user onboarding first.' });
      }

      resolvedUserId = user.id;
    }

    const referral = await createPartnerReferral(partnerId, resolvedUserId);
    res.json({ success: true, message: 'Referral link generated', referral: { id: referral.id, referralCode: referral.referralCode, referralLink: referral.referralLink } });
  } catch (error) {
    console.error('Generate link error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:partnerId/stats', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const stats = await getPartnerStats(partnerId);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:partnerId/earnings', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const earnings = await getPartnerEarningsHistory(partnerId, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: earnings.rows, total: earnings.count, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:partnerId/status', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { status, reason } = req.body;
    const adminWallet = req.headers['x-admin-wallet']?.toString().toLowerCase();
    if (!isAdminWallet(adminWallet)) return res.status(403).json({ success: false, message: 'Only admins can update partner status' });
    if (!status || !['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    let partner;
    if (status === 'approved') {
      partner = await approvePartner(partnerId, adminWallet);
    } else {
      if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      partner = await rejectPartner(partnerId, adminWallet, reason);
    }
    res.json({ success: true, message: `Partner ${status} successfully`, partner: { id: partner.id, name: partner.name, status: partner.status, approvedAt: partner.approvedAt, approvedBy: partner.approvedBy } });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
