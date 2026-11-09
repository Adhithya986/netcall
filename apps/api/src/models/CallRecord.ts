import mongoose, { Schema, Document } from 'mongoose';
import { CallType, CallStatus } from '@netcall/shared';
import { isDatabaseInMemory } from '../db/connection';
import { MemoryCallRecordDoc, MemoryCallRecordOperations } from '../db/memoryStore';

export interface ICallRecord extends Document {
  callId: string;
  callerId: any;
  receiverId?: any;
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
  populate(field: string, select?: string): Promise<this>;
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

const MongooseCallRecordModel = mongoose.models.CallRecord || mongoose.model<ICallRecord>('CallRecord', CallRecordSchema);

export const CallRecord: any = new Proxy(MongooseCallRecordModel, {
  construct(target, args) {
    if (isDatabaseInMemory()) {
      return new MemoryCallRecordDoc(args[0]);
    }
    return new target(...args);
  },
  get(target, prop, receiver) {
    if (isDatabaseInMemory()) {
      if (prop in MemoryCallRecordOperations) {
        return (MemoryCallRecordOperations as any)[prop];
      }
    }
    return Reflect.get(target, prop, receiver);
  }
});
