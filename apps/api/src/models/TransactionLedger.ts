import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType, TransactionStatus } from '@netcall/shared';

export interface ITransactionLedger extends Document {
  transactionId: string;
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  type: TransactionType;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  referenceId?: string;
  description: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionLedgerSchema = new Schema<ITransactionLedger>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    type: {
      type: String,
      enum: ['CREDIT_TOPUP', 'DEBIT_CALL', 'REFUND', 'PROMO_GRANT'],
      required: true
    },
    amountPaise: {
      type: Number,
      required: true
    },
    balanceBeforePaise: {
      type: Number,
      required: true
    },
    balanceAfterPaise: {
      type: Number,
      required: true
    },
    referenceId: {
      type: String,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED', 'REVERSED'],
      default: 'COMPLETED'
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

TransactionLedgerSchema.index({ userId: 1, createdAt: -1 });

export const TransactionLedger = mongoose.model<ITransactionLedger>(
  'TransactionLedger',
  TransactionLedgerSchema
);
