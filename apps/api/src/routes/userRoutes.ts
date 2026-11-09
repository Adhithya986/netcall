import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { searchUserSchema, updateProfileSchema } from '@netcall/shared';

const router = Router();

// Search users by username, email, or full name (for dial pad / contacts)
router.get('/search', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const currentUserId = req.user!.userId;
    const regex = new RegExp(query.trim(), 'i');

    const users = await User.find({
      _id: { $ne: currentUserId },
      status: 'active',
      $or: [{ username: regex }, { fullName: regex }, { email: regex }, { phone: regex }]
    })
      .select('id username fullName email phone avatarUrl')
      .limit(10);

    res.json({
      success: true,
      data: users.map(u => ({
        id: u._id.toString(),
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (validated.fullName !== undefined) user.fullName = validated.fullName.trim();
    if (validated.phone !== undefined) user.phone = validated.phone || undefined;
    if (validated.avatarUrl !== undefined) user.avatarUrl = validated.avatarUrl || undefined;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status
      },
      message: 'Profile updated successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
