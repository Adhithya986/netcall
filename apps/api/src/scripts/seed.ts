import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../db/connection';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { TransactionLedger } from '../models/TransactionLedger';
import { CallRecord } from '../models/CallRecord';
import { TelecomLog } from '../models/TelecomLog';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('[Seed] Starting NetCall database seed script...');

  try {
    await connectDB();

    console.log('[Seed] Clearing existing demo collections...');
    await Promise.all([
      User.deleteMany({}),
      Wallet.deleteMany({}),
      TransactionLedger.deleteMany({}),
      CallRecord.deleteMany({}),
      TelecomLog.deleteMany({})
    ]);

    const passwordHash = await bcrypt.hash('NetCall2026!', 10);

    console.log('[Seed] Creating demo users...');
    // 1. Admin
    const adminUser = new User({
      email: 'admin@netcall.in',
      username: 'admin',
      fullName: 'System Administrator',
      passwordHash,
      role: 'admin',
      status: 'active'
    });
    await adminUser.save();

    // 2. Rohit Sharma
    const rohitUser = new User({
      email: 'rohit@netcall.in',
      username: 'rohit_sharma',
      fullName: 'Rohit Sharma',
      phone: '+919876543210',
      passwordHash,
      role: 'user',
      status: 'active'
    });
    await rohitUser.save();

    // 3. Priya Verma
    const priyaUser = new User({
      email: 'priya@netcall.in',
      username: 'priya_verma',
      fullName: 'Priya Verma',
      phone: '+919123456789',
      passwordHash,
      role: 'user',
      status: 'active'
    });
    await priyaUser.save();

    // 4. Arjun Singh
    const arjunUser = new User({
      email: 'arjun@netcall.in',
      username: 'arjun_singh',
      fullName: 'Arjun Singh',
      phone: '+919988776655',
      passwordHash,
      role: 'user',
      status: 'active'
    });
    await arjunUser.save();

    console.log('[Seed] Creating wallets & ledger transactions...');
    const users = [adminUser, rohitUser, priyaUser, arjunUser];

    for (const u of users) {
      const initialBalance = u.role === 'admin' ? 100000 : 50000;
      const wallet = new Wallet({
        userId: u._id,
        balancePaise: initialBalance,
        currency: 'INR',
        isDemo: true
      });
      await wallet.save();

      const txn = new TransactionLedger({
        transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
        userId: u._id,
        walletId: wallet._id,
        type: 'PROMO_GRANT',
        amountPaise: initialBalance,
        balanceBeforePaise: 0,
        balanceAfterPaise: initialBalance,
        description: `NetCall Welcome Bonus (${u.role === 'admin' ? '₹1,000.00' : '₹500.00'})`,
        status: 'COMPLETED'
      });
      await txn.save();
    }

    console.log('[Seed] Creating historical call records...');
    // A. WebRTC call: Rohit -> Priya (Completed, 3m 42s)
    const startedA = new Date(Date.now() - 1000 * 60 * 45); // 45 mins ago
    const answeredA = new Date(startedA.getTime() + 1000 * 5);
    const endedA = new Date(answeredA.getTime() + 1000 * 222);

    const callA = new CallRecord({
      callId: `call_${Date.now() - 100000}_01`,
      callerId: rohitUser._id,
      receiverId: priyaUser._id,
      callType: 'INTERNET_WEBRTC',
      status: 'COMPLETED',
      startedAt: startedA,
      answeredAt: answeredA,
      endedAt: endedA,
      durationSeconds: 222,
      costPaise: 0,
      endReason: 'Call concluded normally',
      isBilled: true
    });
    await callA.save();

    // B. WebRTC call: Priya -> Rohit (Completed, 1m 15s)
    const startedB = new Date(Date.now() - 1000 * 60 * 20); // 20 mins ago
    const answeredB = new Date(startedB.getTime() + 1000 * 3);
    const endedB = new Date(answeredB.getTime() + 1000 * 75);

    const callB = new CallRecord({
      callId: `call_${Date.now() - 50000}_02`,
      callerId: priyaUser._id,
      receiverId: rohitUser._id,
      callType: 'INTERNET_WEBRTC',
      status: 'COMPLETED',
      startedAt: startedB,
      answeredAt: answeredB,
      endedAt: endedB,
      durationSeconds: 75,
      costPaise: 0,
      endReason: 'Call concluded normally',
      isBilled: true
    });
    await callB.save();

    // C. WebRTC call: Arjun -> Rohit (Missed)
    const callC = new CallRecord({
      callId: `call_${Date.now() - 20000}_03`,
      callerId: arjunUser._id,
      receiverId: rohitUser._id,
      callType: 'INTERNET_WEBRTC',
      status: 'MISSED',
      startedAt: new Date(Date.now() - 1000 * 60 * 10),
      durationSeconds: 0,
      costPaise: 0,
      endReason: 'No answer',
      isBilled: true
    });
    await callC.save();

    // D. Telecom PSTN call: Rohit -> +919876543210 (Completed, 2 min pulse, billed ₹3.00 = 300 paise)
    const startedD = new Date(Date.now() - 1000 * 60 * 5); // 5 mins ago
    const answeredD = new Date(startedD.getTime() + 1000 * 4);
    const endedD = new Date(answeredD.getTime() + 1000 * 115); // 1m 55s -> rounded to 2 mins = 300 paise

    const callD = new CallRecord({
      callId: `call_${Date.now() - 5000}_04`,
      callerId: rohitUser._id,
      destinationNumber: '+919876543210',
      callType: 'TELECOM_PSTN',
      status: 'COMPLETED',
      startedAt: startedD,
      answeredAt: answeredD,
      endedAt: endedD,
      durationSeconds: 115,
      costPaise: 300,
      endReason: 'Carrier completed',
      isBilled: true
    });
    await callD.save();

    // Deduct ₹3.00 from Rohit's wallet
    const rohitWallet = await Wallet.findOne({ userId: rohitUser._id });
    if (rohitWallet) {
      rohitWallet.balancePaise -= 300;
      await rohitWallet.save();

      const txnD = new TransactionLedger({
        transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
        userId: rohitUser._id,
        walletId: rohitWallet._id,
        type: 'DEBIT_CALL',
        amountPaise: 300,
        balanceBeforePaise: 50000,
        balanceAfterPaise: 49700,
        referenceId: callD.callId,
        description: 'Call Usage Debit (2 min @ Indian PSTN rate)',
        status: 'COMPLETED',
        metadata: { durationSeconds: 115, minutes: 2, callId: callD.callId }
      });
      await txnD.save();
    }

    // Save Telecom Log for Call D
    const telecomLogD = new TelecomLog({
      callId: callD.callId,
      providerName: 'MOCK_SANDBOX',
      providerCallSid: `MOCK_SID_${Date.now()}_seed`,
      requestPayload: {
        destinationNumber: '+919876543210',
        fromNumber: rohitUser.username,
        isMock: true
      },
      webhookEvents: [
        {
          receivedAt: answeredD,
          event: 'ANSWERED',
          payload: { status: 'in-progress' }
        },
        {
          receivedAt: endedD,
          event: 'COMPLETED',
          payload: { status: 'completed', Duration: '115' }
        }
      ],
      status: 'COMPLETED'
    });
    await telecomLogD.save();

    console.log('====================================================');
    console.log('  🌱 NETCALL SEED COMPLETED SUCCESSFULLY!          ');
    console.log('----------------------------------------------------');
    console.log('  Demo Users Created (Password: NetCall2026!):     ');
    console.log('  1. admin         (Role: admin, Balance: ₹1,000)  ');
    console.log('  2. rohit_sharma  (Role: user,  Balance: ₹497)    ');
    console.log('  3. priya_verma   (Role: user,  Balance: ₹500)    ');
    console.log('  4. arjun_singh   (Role: user,  Balance: ₹500)    ');
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Fatal error seeding database:', error);
    await disconnectDB();
    process.exit(1);
  }
}

seed();

