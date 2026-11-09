import mongoose, { Schema, Document } from 'mongoose';
import { isDatabaseInMemory } from '../db/connection';
import { MemoryWalletDoc, MemoryWalletOperations } from '../db/memoryStore';

export interface IWallet extends Document {
  userId: any;
  balancePaise: number;
  currency: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    balancePaise: {
      type: Number,
      required: true,
      default: 50000, // ₹500 default
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const MongooseWalletModel = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);

export const Wallet: any = new Proxy(MongooseWalletModel, {
  construct(target, args) {
    if (isDatabaseInMemory()) {
      return new MemoryWalletDoc(args[0]);
    }
    return new target(...args);
  },
  get(target, prop, receiver) {
    if (isDatabaseInMemory()) {
      if (prop in MemoryWalletOperations) {
        return (MemoryWalletOperations as any)[prop];
      }
    }
    return Reflect.get(target, prop, receiver);
  }
});
