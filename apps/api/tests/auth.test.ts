import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Authentication & User Management API', () => {
  const testUser = {
    email: 'rohit@netcall.test',
    username: 'rohit_test',
    fullName: 'Rohit Sharma',
    password: 'Password123!',
    phone: '+919876543210'
  };

  it('should successfully register a new user with hashed password and initial wallet bonus', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should prevent registration with duplicate email or username', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should validate registration input parameters via Zod', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        username: 'ab', // too short
        fullName: '',
        password: 'weak' // missing number/uppercase
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.issues).toBeDefined();
  });

  it('should successfully authenticate user with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testUser.username,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testUser.username,
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow fetching authenticated user profile', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(testUser.username);
    expect(res.body.data.email).toBe(testUser.email);
  });
});
