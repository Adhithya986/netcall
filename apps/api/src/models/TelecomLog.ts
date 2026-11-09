import mongoose, { Schema, Document } from 'mongoose';
import { isDatabaseInMemory } from '../db/connection';
import { MemoryTelecomLogOperations } from '../db/memoryStore';

export interface ITelecomLog extends Document {
  callId: string;
  providerName: string;
  providerCallSid: string;
  requestPayload: Record<string, any>;
  webhookEvents: Array<{
    receivedAt: Date;
    event: string;
    payload: any;
  }>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const TelecomLogSchema = new Schema<ITelecomLog>(
  {
    callId: {
      type: String,
      required: true,
      index: true
    },
    providerName: {
      type: String,
      required: true
    },
    providerCallSid: {
      type: String,
      required: true,
      index: true
    },
    requestPayload: {
      type: Schema.Types.Mixed,
      default: {}
    },
    webhookEvents: [
      {
        receivedAt: {
          type: Date,
          default: Date.now
        },
        event: String,
        payload: Schema.Types.Mixed
      }
    ],
    status: {
      type: String,
      default: 'initiated'
    }
  },
  {
    timestamps: true
  }
);

const MongooseTelecomLogModel = mongoose.models.TelecomLog || mongoose.model<ITelecomLog>('TelecomLog', TelecomLogSchema);

export const TelecomLog: any = new Proxy(MongooseTelecomLogModel, {
  construct(target, args) {
    return new target(...args);
  },
  get(target, prop, receiver) {
    if (isDatabaseInMemory()) {
      if (prop in MemoryTelecomLogOperations) {
        return (MemoryTelecomLogOperations as any)[prop];
      }
    }
    return Reflect.get(target, prop, receiver);
  }
});
