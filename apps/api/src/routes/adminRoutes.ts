import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { CallRecord } from '../models/CallRecord';
import { Wallet } from '../models/Wallet';
import { TransactionLedger } from '../models/TransactionLedger';
import { getTelephonyProvider } from '../telephony';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticate, requireRole('admin'));

// System Analytics & Stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const [totalUsers, totalCalls, completedCalls, totalLedger] = await Promise.all([
      User.countDocuments(),
      CallRecord.countDocuments(),
      CallRecord.find({ status: 'COMPLETED' }).select('durationSeconds costPaise callType'),
      TransactionLedger.aggregate([
        {
          $group: {
            _id: '$type',
            totalPaise: { $sum: '$amountPaise' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalDurationSeconds = completedCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const totalRevenuePaise = completedCalls.reduce((acc, c) => acc + (c.costPaise || 0), 0);
    const webrtcCallsCount = completedCalls.filter(c => c.callType === 'INTERNET_WEBRTC').length;
    const pstnCallsCount = completedCalls.filter(c => c.callType === 'TELECOM_PSTN').length;

    const providerInfo = getTelephonyProvider().getProviderInfo();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCalls,
        completedCalls: completedCalls.length,
        webrtcCallsCount,
        pstnCallsCount,
        totalDurationSeconds,
        totalRevenuePaise,
        totalRevenueINR: (totalRevenuePaise / 100).toFixed(2),
        ledgerSummary: totalLedger,
        telephonyProvider: providerInfo
      }
    });
  } catch (err) {
    next(err);
  }
});

// Admin User Management
router.get('/users', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('username email fullName phone role status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    // Fetch wallet balances for these users
    const userIds = users.map(u => u._id);
    const wallets = await Wallet.find({ userId: { $in: userIds } });
    const walletMap = new Map(wallets.map(w => [w.userId.toString(), w.balancePaise]));

    const enrichedUsers = users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      status: u.status,
      balancePaise: walletMap.get(u._id.toString()) || 0,
      createdAt: u.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: {
        users: enrichedUsers,
        total,
        page,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// Update User Status (Suspend / Activate)
router.patch('/users/:userId/status', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid user status' });
      return;
    }

    if (userId === req.user!.userId) {
      res.status(400).json({ success: false, error: 'Cannot modify your own administrative status' });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { status }, { new: true })
      .select('username email role status');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
      message: `User status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
});

// Global Call Records
router.get('/calls', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      CallRecord.find()
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('callerId', 'username fullName')
        .populate('receiverId', 'username fullName'),
      CallRecord.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        calls,
        total,
        page,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
