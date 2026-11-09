import mongoose, { Schema, Document } from 'mongoose';

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

export const TelecomLog = mongoose.model<ITelecomLog>('TelecomLog', TelecomLogSchema);
