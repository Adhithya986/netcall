import { Router, Request, Response } from 'express';
import { getTelephonyProvider } from '../telephony';
import { CallService } from '../services/callService';
import { TelecomLog } from '../models/TelecomLog';

const router = Router();

// Get Telephony Provider Information & Compliance Status
router.get('/provider', (req: Request, res: Response) => {
  const provider = getTelephonyProvider();
  res.json({
    success: true,
    data: provider.getProviderInfo()
  });
});

// Carrier Status Webhook Endpoint
router.post('/webhook/:providerName', async (req: Request, res: Response, next) => {
  try {
    const { providerName } = req.params;
    const provider = getTelephonyProvider();

    // Verify webhook signature
    const isValid = provider.verifyWebhookSignature(req.headers as any, req.body);
    if (!isValid) {
      console.warn(`[Telephony Webhook] Signature verification failed for provider: ${providerName}`);
      res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      return;
    }

    const callbackData = provider.parseWebhookPayload(req.body);
    console.log(`[Telephony Webhook] Received status callback:`, callbackData);

    // Update TelecomLog
    if (callbackData.callId) {
      await TelecomLog.findOneAndUpdate(
        { callId: callbackData.callId },
        {
          $push: {
            webhookEvents: {
              receivedAt: new Date(),
              event: callbackData.callStatus,
              payload: req.body
            }
          },
          status: callbackData.callStatus
        }
      );

      // Reconcile CallRecord if call completed
      if (callbackData.callStatus === 'COMPLETED' || callbackData.callStatus === 'FAILED') {
        await CallService.endCall(
          callbackData.callId,
          `Carrier report: ${callbackData.callStatus}`,
          callbackData.callStatus
        );
      } else if (callbackData.callStatus === 'ANSWERED') {
        await CallService.markAnswered(callbackData.callId);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
});

// Sandbox Simulation Trigger (for local testing without live PSTN carrier)
router.post('/sandbox/simulate-event', async (req: Request, res: Response, next) => {
  try {
    const { callId, event, durationSeconds } = req.body;
    if (!callId) {
      res.status(400).json({ success: false, error: 'callId is required' });
      return;
    }

    if (event === 'answered') {
      const record = await CallService.markAnswered(callId);
      res.json({ success: true, data: record });
      return;
    }

    if (event === 'completed') {
      const record = await CallService.endCall(
        callId,
        'Simulated carrier completion',
        'COMPLETED'
      );
      res.json({ success: true, data: record });
      return;
    }

    res.status(400).json({ success: false, error: 'Unknown event type' });
  } catch (err) {
    next(err);
  }
});

export default router;

