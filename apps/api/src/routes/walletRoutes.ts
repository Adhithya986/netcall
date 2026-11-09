import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { WalletService } from '../services/walletService';
import { topUpWalletSchema, DEFAULT_PRICING_PLANS } from '@netcall/shared';

const router = Router();

// Get Wallet
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const wallet = await WalletService.getWallet(req.user!.userId);
    res.json({
      success: true,
      data: wallet
    });
  } catch (err) {
    next(err);
  }
});

// Get Pricing Plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: DEFAULT_PRICING_PLANS
  });
});

// Top Up Wallet (Sandbox / Demo Mode)
router.post('/topup', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = topUpWalletSchema.parse(req.body);
    let description = 'Wallet Credit Top-up (Sandbox)';

    if (validated.planId) {
      const plan = DEFAULT_PRICING_PLANS.find(p => p.id === validated.planId);
      if (plan) {
        description = `Top-up: ${plan.name} Plan (Sandbox)`;
      }
    }

    const result = await WalletService.topUp(
      req.user!.userId,
      validated.amountPaise,
      description
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully credited ₹${(validated.amountPaise / 100).toFixed(2)} to your NetCall wallet (Demo Sandbox)`
    });
  } catch (err) {
    next(err);
  }
});

// Get User Transaction Ledger
router.get('/transactions', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const result = await WalletService.getTransactions(req.user!.userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;

