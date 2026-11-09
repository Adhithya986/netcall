import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Wallet } from '../models/Wallet';
import { TransactionLedger } from '../models/TransactionLedger';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { RegisterInput, LoginInput, AuthResponse, UserDTO } from '@netcall/shared';

function toUserDTO(user: IUser): UserDTO {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString()
  };
}

function generateTokens(user: IUser) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any
  });

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), tokenVersion: uuidv4() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );

  return { accessToken, refreshToken };
}

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await User.findOne({
      $or: [{ email: input.email.toLowerCase() }, { username: input.username.toLowerCase() }]
    });

    if (existing) {
      if (existing.email === input.email.toLowerCase()) {
        throw new Error('An account with this email address already exists');
      }
      throw new Error('This username is already taken');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // If first user, promote to admin for convenience
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = new User({
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      fullName: input.fullName.trim(),
      passwordHash,
      phone: input.phone,
      role,
      status: 'active'
    });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Create Initial Wallet with welcome bonus credits
    const initialPaise = config.billing.initialWalletPaise;
    const wallet = new Wallet({
      userId: user._id,
      balancePaise: initialPaise,
      currency: 'INR',
      isDemo: true
    });
    await wallet.save();

    // Create Welcome Grant Transaction
    const transaction = new TransactionLedger({
      transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId: user._id,
      walletId: wallet._id,
      type: 'PROMO_GRANT',
      amountPaise: initialPaise,
      balanceBeforePaise: 0,
      balanceAfterPaise: initialPaise,
      description: 'NetCall Welcome Calling Credits (₹500.00)',
      status: 'COMPLETED'
    });
    await transaction.save();

    return {
      user: toUserDTO(user),
      accessToken,
      refreshToken
    };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await User.findOne({
      $or: [
        { email: input.identifier.toLowerCase() },
        { username: input.identifier.toLowerCase() }
      ]
    });

    if (!user) {
      throw new Error('Invalid email/username or password');
    }

    if (user.status === 'suspended') {
      throw new Error('Your account has been suspended. Please contact NetCall support.');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new Error('Invalid email/username or password');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Keep only last 5 active refresh tokens per user
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      user: toUserDTO(user),
      accessToken,
      refreshToken
    };
  }

  static async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || !user.refreshTokens.includes(token)) {
        throw new Error('Invalid or revoked refresh token');
      }

      // Rotate token
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
      const newTokens = generateTokens(user);
      user.refreshTokens.push(newTokens.refreshToken);
      await user.save();

      return newTokens;
    } catch (err: any) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      } else {
        user.refreshTokens = [];
      }
      await user.save();
    }
  }

  static async getUserProfile(userId: string): Promise<UserDTO> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return toUserDTO(user);
  }
}
