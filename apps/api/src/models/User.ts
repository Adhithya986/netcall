import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@netcall/shared';
import { isDatabaseInMemory } from '../db/connection';
import { MemoryUserDoc, MemoryUserOperations } from '../db/memoryStore';

export interface IUser extends Document {
  email: string;
  username: string;
  fullName: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active'
    },
    avatarUrl: {
      type: String
    },
    refreshTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const MongooseUserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export const User: any = new Proxy(MongooseUserModel, {
  construct(target, args) {
    if (isDatabaseInMemory()) {
      return new MemoryUserDoc(args[0]);
    }
    return new target(...args);
  },
  get(target, prop, receiver) {
    if (isDatabaseInMemory()) {
      if (prop in MemoryUserOperations) {
        return (MemoryUserOperations as any)[prop];
      }
    }
    return Reflect.get(target, prop, receiver);
  }
});
