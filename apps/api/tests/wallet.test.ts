import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Wallet, Plans & Transaction Ledger API', () => {
  let userToken: string;

  const getAuthedUser = async () => {
    const rand = Math.floor(Math.random() * 9000);
    const res = await request(app).post('/api/auth/register').send({
      email: `wallet_${rand}@netcall.test`,
      username: `wallet_user_${rand}`,
      fullName: 'Wallet Test User',
      password: 'Password123!'
    });
    return res.body.data.accessToken;
  };

  it('should initialize wallet with ₹500 demo balance upon registration', async () => {
    userToken = await getAuthedUser();

    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balancePaise).toBe(50000); // 50,000 paise = ₹500.00
    expect(res.body.data.currency).toBe('INR');
  });

  it('should return default pricing plans list', async () => {
    const res = await request(app).get('/api/wallet/plans');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].pstnRatePerMinutePaise).toBeDefined();
  });

  it('should process sandbox top-up and record an auditable ledger entry', async () => {
    userToken = await getAuthedUser();

    const topUpAmountPaise = 25000; // ₹250
    const topUpRes = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amountPaise: topUpAmountPaise,
        planId: 'starter'
      });

    expect(topUpRes.status).toBe(201);
    expect(topUpRes.body.success).toBe(true);
    expect(topUpRes.body.data.wallet.balancePaise).toBe(75000); // 50000 + 25000 = 75000 paise

    // Verify transaction ledger
    const ledgerRes = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(ledgerRes.status).toBe(200);
    expect(ledgerRes.body.data.transactions.length).toBeGreaterThan(1); // Welcome grant + topup
    const latestTx = ledgerRes.body.data.transactions[0];
    expect(latestTx.type).toBe('CREDIT_TOPUP');
    expect(latestTx.amountPaise).toBe(topUpAmountPaise);
    expect(latestTx.balanceBeforePaise).toBe(50000);
    expect(latestTx.balanceAfterPaise).toBe(75000);
  });
});

