import mongoose from 'mongoose';
import { CallRecord, ICallRecord } from '../models/CallRecord';
import { User } from '../models/User';
import { WalletService } from './walletService';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';
import {
  CallInitiatePayload,
  CallRecordDTO,
  CallStatus,
  CallType,
  RATES_PAISE
} from '@netcall/shared';

function toCallRecordDTO(record: any): CallRecordDTO {
  return {
    id: record._id.toString(),
    callId: record.callId,
    callerId: record.callerId?._id ? record.callerId._id.toString() : record.callerId?.toString(),
    callerName: record.callerId?.fullName || 'Unknown Caller',
    callerUsername: record.callerId?.username || 'unknown',
    receiverId: record.receiverId?._id ? record.receiverId._id.toString() : record.receiverId?.toString(),
    receiverName: record.receiverId?.fullName,
    receiverUsername: record.receiverId?.username,
    destinationNumber: record.destinationNumber,
    callType: record.callType,
    status: record.status,
    startedAt: record.startedAt ? new Date(record.startedAt).toISOString() : new Date().toISOString(),
    answeredAt: record.answeredAt ? new Date(record.answeredAt).toISOString() : undefined,
    endedAt: record.endedAt ? new Date(record.endedAt).toISOString() : undefined,
    durationSeconds: record.durationSeconds || 0,
    costPaise: record.costPaise || 0,
    endReason: record.endReason
  };
}

export class CallService {
  static async initiateCall(
    callerId: string,
    payload: CallInitiatePayload
  ): Promise<{ callRecord: CallRecordDTO; targetUser?: any }> {
    const caller = await User.findById(callerId);
    if (!caller) {
      throw new Error('Caller not found');
    }

    const callId = `call_${Date.now()}_${uuidv4().substring(0, 6)}`;
    let receiverUser: any = null;

    if (payload.callType === 'INTERNET_WEBRTC') {
      if (payload.targetUserId) {
        receiverUser = await User.findById(payload.targetUserId);
      } else if (payload.targetUsername) {
        receiverUser = await User.findOne({ username: payload.targetUsername.toLowerCase() });
      }

      if (!receiverUser) {
        throw new Error('Destination user could not be found');
      }

      if (receiverUser._id.toString() === callerId) {
        throw new Error('Cannot initiate a call to your own account');
      }
    } else if (payload.callType === 'TELECOM_PSTN') {
      // Check wallet balance for PSTN call (minimum 1 minute balance required)
      const wallet = await WalletService.getWallet(callerId);
      const minRequiredPaise = config.billing.pstnRatePerMinutePaise;

      if (wallet.balancePaise < minRequiredPaise) {
        throw new Error(
          `Insufficient balance. A minimum of ₹${(minRequiredPaise / 100).toFixed(2)} is required to place a PSTN call.`
        );
      }
    }

    const callRecord = new CallRecord({
      callId,
      callerId: caller._id,
      receiverId: receiverUser ? receiverUser._id : undefined,
      destinationNumber: payload.destinationNumber,
      callType: payload.callType,
      status: 'INITIATED',
      startedAt: new Date(),
      durationSeconds: 0,
      costPaise: 0,
      isBilled: false
    });

    await callRecord.save();

    // Populate user info for DTO
    await callRecord.populate('callerId', 'fullName username email');
    if (receiverUser) {
      await callRecord.populate('receiverId', 'fullName username email');
    }

    return {
      callRecord: toCallRecordDTO(callRecord),
      targetUser: receiverUser
        ? {
            id: receiverUser._id.toString(),
            fullName: receiverUser.fullName,
            username: receiverUser.username
          }
        : undefined
    };
  }

  static async markAnswered(callId: string): Promise<CallRecordDTO> {
    const record = await CallRecord.findOne({ callId });
    if (!record) {
      throw new Error('Call record not found');
    }

    record.status = 'ANSWERED';
    record.answeredAt = new Date();
    await record.save();

    await record.populate('callerId', 'fullName username email');
    await record.populate('receiverId', 'fullName username email');
    return toCallRecordDTO(record);
  }

  static async endCall(
    callId: string,
    endReason: string = 'User hung up',
    finalStatus?: CallStatus
  ): Promise<CallRecordDTO> {
    const record = await CallRecord.findOne({ callId });
    if (!record) {
      throw new Error('Call record not found');
    }

    const endedAt = new Date();
    record.endedAt = endedAt;
    record.endReason = endReason;

    if (finalStatus) {
      record.status = finalStatus;
    } else if (record.status === 'ANSWERED') {
      record.status = 'COMPLETED';
    } else if (record.status === 'INITIATED' || record.status === 'RINGING') {
      record.status = 'MISSED';
    }

    // Calculate duration in seconds
    let durationSeconds = 0;
    if (record.answeredAt) {
      durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - record.answeredAt.getTime()) / 1000));
    }
    record.durationSeconds = durationSeconds;

    // Calculate billing
    let costPaise = 0;
    if (record.status === 'COMPLETED' && durationSeconds > 0) {
      if (record.callType === 'TELECOM_PSTN') {
        const billableMinutes = Math.ceil(durationSeconds / 60);
        costPaise = billableMinutes * config.billing.pstnRatePerMinutePaise;
      } else {
        costPaise = 0; // WebRTC calls are free
      }
    }
    record.costPaise = costPaise;

    // Deduct from wallet if not already billed and billable
    if (costPaise > 0 && !record.isBilled) {
      await WalletService.deductForCall(
        record.callerId.toString(),
        costPaise,
        record.callId,
        durationSeconds
      );
      record.isBilled = true;
    }

    await record.save();

    await record.populate('callerId', 'fullName username email');
    await record.populate('receiverId', 'fullName username email');
    return toCallRecordDTO(record);
  }

  static async getCallHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ calls: CallRecordDTO[]; total: number; page: number; pages: number }> {
    const userFilter = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ callerId: userFilter }, { receiverId: userFilter }]
    };

    const [records, total] = await Promise.all([
      CallRecord.find(query)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('callerId', 'fullName username email')
        .populate('receiverId', 'fullName username email'),
      CallRecord.countDocuments(query)
    ]);

    return {
      calls: records.map(toCallRecordDTO),
      total,
      page,
      pages: Math.ceil(total / limit) || 1
    };
  }

  static async getCallByCallId(callId: string): Promise<CallRecordDTO | null> {
    const record = await CallRecord.findOne({ callId })
      .populate('callerId', 'fullName username email')
      .populate('receiverId', 'fullName username email');

    return record ? toCallRecordDTO(record) : null;
  }
}
