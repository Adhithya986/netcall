import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType, TransactionStatus } from '@netcall/shared';
import { isDatabaseInMemory } from '../db/connection';
import { MemoryLedgerDoc, MemoryLedgerOperations } from '../db/memoryStore';

export interface ITransactionLedger extends Document {
  transactionId: string;
  userId: any;
  walletId: any;
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

const MongooseLedgerModel = mongoose.models.TransactionLedger || mongoose.model<ITransactionLedger>(
  'TransactionLedger',
  TransactionLedgerSchema
);

export const TransactionLedger: any = new Proxy(MongooseLedgerModel, {
  construct(target, args) {
    if (isDatabaseInMemory()) {
      return new MemoryLedgerDoc(args[0]);
    }
    return new target(...args);
  },
  get(target, prop, receiver) {
    if (isDatabaseInMemory()) {
      if (prop in MemoryLedgerOperations) {
        return (MemoryLedgerOperations as any)[prop];
      }
    }
    return Reflect.get(target, prop, receiver);
  }
});
