import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
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

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
