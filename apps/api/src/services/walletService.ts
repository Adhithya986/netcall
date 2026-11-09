import mongoose from 'mongoose';
import { Wallet, IWallet } from '../models/Wallet';
import { TransactionLedger, ITransactionLedger } from '../models/TransactionLedger';
import { v4 as uuidv4 } from 'uuid';
import { WalletDTO, TransactionLedgerDTO } from '@netcall/shared';

function toWalletDTO(wallet: IWallet): WalletDTO {
  return {
    id: wallet._id.toString(),
    userId: wallet.userId.toString(),
    balancePaise: wallet.balancePaise,
    currency: 'INR',
    isDemo: wallet.isDemo,
    updatedAt: wallet.updatedAt.toISOString()
  };
}

function toLedgerDTO(entry: ITransactionLedger): TransactionLedgerDTO {
  return {
    id: entry._id.toString(),
    transactionId: entry.transactionId,
    userId: entry.userId.toString(),
    type: entry.type,
    amountPaise: entry.amountPaise,
    balanceBeforePaise: entry.balanceBeforePaise,
    balanceAfterPaise: entry.balanceAfterPaise,
    referenceId: entry.referenceId,
    description: entry.description,
    status: entry.status,
    createdAt: entry.createdAt.toISOString()
  };
}

export class WalletService {
  static async getWallet(userId: string): Promise<WalletDTO> {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balancePaise: 50000,
        currency: 'INR',
        isDemo: true
      });
      await wallet.save();
    }
    return toWalletDTO(wallet);
  }

  static async topUp(
    userId: string,
    amountPaise: number,
    description: string = 'Wallet Credit Top-up (Sandbox)'
  ): Promise<{ wallet: WalletDTO; transaction: TransactionLedgerDTO }> {
    if (amountPaise <= 0) {
      throw new Error('Top-up amount must be greater than zero');
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balanceBefore = wallet.balancePaise;
    const balanceAfter = balanceBefore + amountPaise;

    wallet.balancePaise = balanceAfter;
    await wallet.save();

    const transaction = new TransactionLedger({
      transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId,
      walletId: wallet._id,
      type: 'CREDIT_TOPUP',
      amountPaise,
      balanceBeforePaise: balanceBefore,
      balanceAfterPaise: balanceAfter,
      description,
      status: 'COMPLETED'
    });
    await transaction.save();

    return {
      wallet: toWalletDTO(wallet),
      transaction: toLedgerDTO(transaction)
    };
  }

  static async deductForCall(
    userId: string,
    amountPaise: number,
    callId: string,
    durationSeconds: number
  ): Promise<{ success: boolean; newBalancePaise: number }> {
    if (amountPaise <= 0) {
      const wallet = await this.getWallet(userId);
      return { success: true, newBalancePaise: wallet.balancePaise };
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('Wallet not found for deduction');
    }

    const balanceBefore = wallet.balancePaise;
    if (balanceBefore < amountPaise) {
      console.warn(`[Wallet] Insufficient funds for user ${userId}. Balance: ${balanceBefore}, Required: ${amountPaise}`);
      // Still log attempt or allow negative/grace in sandbox
    }

    const balanceAfter = Math.max(0, balanceBefore - amountPaise);
    wallet.balancePaise = balanceAfter;
    await wallet.save();

    const minutes = Math.ceil(durationSeconds / 60);
    const transaction = new TransactionLedger({
      transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId,
      walletId: wallet._id,
      type: 'DEBIT_CALL',
      amountPaise,
      balanceBeforePaise: balanceBefore,
      balanceAfterPaise: balanceAfter,
      referenceId: callId,
      description: `Call Usage Debit (${minutes} min @ Indian PSTN rate)`,
      status: 'COMPLETED',
      metadata: { durationSeconds, minutes, callId }
    });
    await transaction.save();

    return { success: true, newBalancePaise: balanceAfter };
  }

  static async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ transactions: TransactionLedgerDTO[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      TransactionLedger.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TransactionLedger.countDocuments({ userId })
    ]);

    return {
      transactions: entries.map(toLedgerDTO),
      total,
      page,
      pages: Math.ceil(total / limit) || 1
    };
  }
}
