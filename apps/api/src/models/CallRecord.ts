import mongoose, { Schema, Document } from 'mongoose';
import { CallType, CallStatus } from '@netcall/shared';

export interface ICallRecord extends Document {
  callId: string;
  callerId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  destinationNumber?: string;
  callType: CallType;
  status: CallStatus;
  startedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  costPaise: number;
  endReason?: string;
  isBilled: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CallRecordSchema = new Schema<ICallRecord>(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    callerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    destinationNumber: {
      type: String,
      trim: true
    },
    callType: {
      type: String,
      enum: ['INTERNET_WEBRTC', 'TELECOM_PSTN'],
      required: true
    },
    status: {
      type: String,
      enum: [
        'INITIATED',
        'RINGING',
        'ANSWERED',
        'REJECTED',
        'BUSY',
        'MISSED',
        'COMPLETED',
        'FAILED'
      ],
      default: 'INITIATED',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    answeredAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    costPaise: {
      type: Number,
      default: 0
    },
    endReason: {
      type: String
    },
    isBilled: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

CallRecordSchema.index({ callerId: 1, startedAt: -1 });
CallRecordSchema.index({ receiverId: 1, startedAt: -1 });

export const CallRecord = mongoose.model<ICallRecord>('CallRecord', CallRecordSchema);
