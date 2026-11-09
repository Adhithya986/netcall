import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Admin Dashboard & Management API', () => {
  let adminToken: string;
  let userToken: string;
  let regularUserId: string;

  beforeEach(async () => {
    // Register first user (admin role)
    const adminRes = await request(app).post('/api/auth/register').send({
      email: 'chief_admin@netcall.test',
      username: 'admin_test',
      fullName: 'Super Administrator',
      password: 'AdminPassword123!'
    });
    adminToken = adminRes.body.data.accessToken;

    // Register second user (regular user role)
    const userRes = await request(app).post('/api/auth/register').send({
      email: 'regular_user@netcall.test',
      username: 'regular_user',
      fullName: 'Regular User',
      password: 'UserPassword123!'
    });
    userToken = userRes.body.data.accessToken;
    regularUserId = userRes.body.data.user.id;
  });

  it('should restrict admin endpoints from unauthorized or non-admin users', async () => {
    // Non-admin attempt
    const forbiddenRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(forbiddenRes.status).toBe(403);
  });

  it('should allow admin to retrieve platform metrics without exposing secrets', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(2);
    expect(res.body.data.telephonyProvider).toBeDefined();
  });

  it('should allow admin to suspend and reactivate users', async () => {
    const suspendRes = await request(app)
      .patch(`/api/admin/users/${regularUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('suspended');

    // Suspended user cannot login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'regular_user',
        password: 'UserPassword123!'
      });

    expect(loginRes.status).toBe(400);
    expect(loginRes.body.error).toContain('suspended');
  });
});
