import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { callRateLimiter } from '../middleware/rateLimiter';
import { CallService } from '../services/callService';
import { getTelephonyProvider } from '../telephony';
import { TelecomLog } from '../models/TelecomLog';
import { initiateCallSchema } from '@netcall/shared';

const router = Router();

// Initiate Call (WebRTC or Telecom PSTN)
router.post('/initiate', authenticate, callRateLimiter, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = initiateCallSchema.parse(req.body);
    const userId = req.user!.userId;

    if (validated.callType === 'INTERNET_WEBRTC') {
      const result = await CallService.initiateCall(userId, validated);
      res.status(201).json({
        success: true,
        data: result
      });
      return;
    }

    if (validated.callType === 'TELECOM_PSTN') {
      // PSTN Call initiation via Telephony Layer
      const provider = getTelephonyProvider();
      const { callRecord } = await CallService.initiateCall(userId, validated);

      const telecomResult = await provider.initiateOutboundCall({
        callId: callRecord.callId,
        fromNumber: req.user!.username, // or allocated virtual DID
        toNumber: validated.destinationNumber!,
        callerName: req.user!.username
      });

      // Save telecom log
      await TelecomLog.create({
        callId: callRecord.callId,
        providerName: provider.name,
        providerCallSid: telecomResult.providerCallSid,
        requestPayload: {
          destinationNumber: validated.destinationNumber,
          isMock: telecomResult.isMock
        },
        status: telecomResult.status
      });

      res.status(201).json({
        success: true,
        data: {
          callRecord,
          telecomResult,
          isMock: telecomResult.isMock,
          providerInfo: provider.getProviderInfo()
        }
      });
      return;
    }
  } catch (err) {
    next(err);
  }
});

// End Call
router.post('/:callId/end', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { callId } = req.params;
    const { reason, finalStatus } = req.body;
    const result = await CallService.endCall(callId, reason, finalStatus);

    res.json({
      success: true,
      data: result,
      message: 'Call session concluded'
    });
  } catch (err) {
    next(err);
  }
});

// Get User Call History
router.get('/history', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const result = await CallService.getCallHistory(req.user!.userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Get Single Call Record
router.get('/:callId', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await CallService.getCallByCallId(req.params.callId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Call not found' });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
