
import express from 'express';
import { Merchant, MerchantClaimCode } from '../models/index.js';
import { Op } from 'sequelize';
import { verifyMessage } from 'ethers';
import { createMerchantCodeAuthorizationMessage, generateMerchantClaimCode, hashMerchantClaimCode, hashMerchantCodeAuthorization } from '../utils/merchantClaimCode.js';

const router = express.Router();

// GET /api/merchants/wallets - List all merchant wallet addresses (public)
router.get('/wallets', async (req, res) => {
  try {
    const merchants = await Merchant.findAll({ attributes: ['wallet'], where: { wallet: { [Op.ne]: null } } });
    const wallets = merchants.map(m => m.wallet?.toLowerCase()).filter(Boolean);
    res.json({ wallets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only middleware (supports multiple admin wallets from env)
function requireAdmin(req, res, next) {
  const admin = req.headers['x-admin-wallet'] || req.body.admin || req.query.admin;
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (!admin || !adminWallets.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

function isAdminWallet(wallet) {
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  return Boolean(wallet) && adminWallets.includes(String(wallet).toLowerCase());
}

// POST /api/merchants/add - Add a new merchant (admin only)
router.post('/add', requireAdmin, async (req, res) => {
  const { name, wallet, address, longitude, latitude } = req.body;
  if (!name || !address || longitude == null || latitude == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const merchant = await Merchant.create({ name, wallet: wallet ? wallet.toLowerCase() : null, address, longitude, latitude });
    res.json({ success: true, merchant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants/list - List all merchants (admin only)
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const merchants = await Merchant.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ merchants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/merchants/:id/claim-codes - Generate a fixed-reward, single-use purchase code
router.post('/:id/claim-codes', async (req, res) => {
  try {
    const merchant = await Merchant.findByPk(req.params.id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    const { issuedAt, nonce, signature } = req.body;
    const issuedAtMs = Date.parse(issuedAt);
    if (!signature || !nonce || !Number.isFinite(issuedAtMs) || Math.abs(Date.now() - issuedAtMs) > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'A recent wallet authorization is required.' });
    }

    let operatorWallet;
    try {
      const message = createMerchantCodeAuthorizationMessage(merchant.id, issuedAt, nonce);
      operatorWallet = verifyMessage(message, signature).toLowerCase();
    } catch {
      return res.status(401).json({ error: 'Invalid wallet authorization.' });
    }

    const isMerchant = merchant.wallet && merchant.wallet.toLowerCase() === operatorWallet;
    if (!isMerchant && !isAdminWallet(operatorWallet)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const authorizationHash = hashMerchantCodeAuthorization(signature);
    const existingAuthorization = await MerchantClaimCode.findOne({ where: { authorizationHash } });
    if (existingAuthorization) {
      return res.status(409).json({ error: 'This wallet authorization has already been used.' });
    }

    const rewardAmount = String(process.env.MERCHANT_CLAIM_REWARD_AMOUNT || '100000');
    const expiryMinutes = Number.parseInt(process.env.MERCHANT_CLAIM_CODE_EXPIRY_MINUTES || '30', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateMerchantClaimCode();
      try {
        const claimCode = await MerchantClaimCode.create({
          merchantId: merchant.id,
          codeHash: hashMerchantClaimCode(code),
          codeLastFour: code.slice(-4),
          authorizationHash,
          rewardAmount,
          expiresAt,
        });
        return res.status(201).json({
          success: true,
          claimCode: { id: claimCode.id, code, rewardAmount, expiresAt },
        });
      } catch (error) {
        if (error?.name !== 'SequelizeUniqueConstraintError') throw error;
      }
    }

    return res.status(503).json({ error: 'Unable to generate a unique code. Please try again.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// PUT /api/merchants/:id - Edit merchant details (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, wallet, address, longitude, latitude } = req.body;
  try {
    const merchant = await Merchant.findByPk(req.params.id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    if (name !== undefined) merchant.name = name;
    if (wallet !== undefined) merchant.wallet = wallet ? wallet.toLowerCase() : null;
    if (address !== undefined) merchant.address = address;
    if (longitude !== undefined) merchant.longitude = longitude;
    if (latitude !== undefined) merchant.latitude = latitude;
    await merchant.save();
    res.json({ success: true, merchant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// GET /api/merchants/:id - Public endpoint to fetch merchant by ID
router.get('/:id', async (req, res) => {
  try {
    const merchant = await Merchant.findByPk(req.params.id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    res.json(merchant);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
