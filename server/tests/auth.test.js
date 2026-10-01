import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { initializeDatabase } from '../db/init.js';
import { mountCommunityRoutes } from '../app.js';
import { env } from '../config/env.js';
import { query } from '../config/database.js';

let server;
let baseUrl;

before(async () => {
  await initializeDatabase();
  await mountCommunityRoutes(env.sqlitePath);
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('1. Missing and Invalid Authentication (401)', () => {
  it('rejects GET /api/auth/me without Authorization header', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication required.');
  });

  it('rejects GET /api/users/me without token', async () => {
    const res = await fetch(`${baseUrl}/api/users/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication required.');
  });

  it('rejects GET /api/requests without token', async () => {
    const res = await fetch(`${baseUrl}/api/requests`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication required.');
  });

  it('rejects POST /api/requests without token', async () => {
    const res = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Need groceries' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication required.');
  });

  it('rejects GET /api/offers without token', async () => {
    const res = await fetch(`${baseUrl}/api/offers`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication required.');
  });

  it('rejects POST /api/verification/community without token', async () => {
    const res = await fetch(`${baseUrl}/api/verification/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TSEC-2026-X7K9' }),
    });
    assert.equal(res.status, 401);
  });

  it('rejects requests with malformed Authorization format (non-Bearer)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication required.');
  });

  it('rejects requests with forged/invalid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Invalid or expired token.');
  });

  it('rejects requests with token signed by wrong secret', async () => {
    const forgedToken = jwt.sign({ sub: 'fake-user-id', email: 'fake@example.com' }, 'wrong-secret');
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Invalid or expired token.');
  });

  it('rejects requests with expired token', async () => {
    const expiredToken = jwt.sign(
      { sub: 'user-id', email: 'user@example.com' },
      env.jwtSecret,
      { expiresIn: '-1s' }
    );
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Invalid or expired token.');
  });
});

describe('2. User Registration and Token Issuance', () => {
  const testEmail1 = `alice_${Date.now()}@example.com`;
  const testEmail2 = `bob_${Date.now()}@example.com`;
  let user1Token;
  let user1;
  let user2Token;
  let user2;

  it('fails registration when email is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'invalid-email', password: 'Password123!' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /valid email/i);
  });

  it('fails registration when password is less than 8 chars', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: testEmail1, password: 'short' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /at least 8 characters/i);
  });

  it('successfully registers user 1 and returns token & sanitized user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Smith',
        email: testEmail1,
        password: 'SecurePassword123!',
        phone: '1234567890',
        area: 'Downtown',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.token, 'Token should be returned');
    assert.ok(body.user, 'User object should be returned');
    assert.equal(body.user.email, testEmail1);
    assert.equal(body.user.name, 'Alice Smith');
    assert.equal(body.user.password_hash, undefined, 'password_hash must be sanitized');
    assert.equal(body.user.phone, undefined, 'phone must be sanitized');

    user1Token = body.token;
    user1 = body.user;
  });

  it('prevents registering duplicate email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Duplicate',
        email: testEmail1,
        password: 'AnotherPassword123!',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /already exists/i);
  });

  it('successfully registers user 2 (Bob)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Jones',
        email: testEmail2,
        password: 'BobSecurePassword123!',
        area: 'Uptown',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    user2Token = body.token;
    user2 = body.user;
  });

  describe('3. Login Authentication', () => {
    it('rejects login with wrong password', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: 'WrongPassword!' }),
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.match(body.error, /invalid email or password/i);
    });

    it('rejects login with unknown email', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com', password: 'Password123!' }),
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.match(body.error, /invalid email or password/i);
    });

    it('successfully logs in with correct credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: 'SecurePassword123!' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.token);
      assert.equal(body.user.email, testEmail1);
    });
  });

  describe('4. Token Verification & Identity Resolution', () => {
    it('fetches current user profile via /api/auth/me using token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.user.id, user1.id);
      assert.equal(body.user.email, testEmail1);
    });

    it('fetches current user via /api/users/me', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.user.id, user1.id);
    });
  });

  describe('5. Resource Ownership Authorization (User Profiles)', () => {
    it('forbids User 2 from updating User 1 profile (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/users/${user1.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error, 'You can only update your own profile.');
    });

    it('allows User 1 to update their own profile (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/users/${user1.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ name: 'Alice Updated' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.user.name, 'Alice Updated');
    });
  });

  describe('6. Resource Ownership Authorization (Help Requests)', () => {
    let requestId;

    it('creates a help request for User 1', async () => {
      const res = await fetch(`${baseUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          title: 'Grocery help',
          description: 'Need help with groceries',
          category: 'Shopping',
          area: 'Downtown',
          latitude: 19.076,
          longitude: 72.8777,
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(body.request.id);
      assert.equal(body.request.requester_id, user1.id);
      requestId = body.request.id;
    });

    it('prevents User 2 from editing User 1 request', async () => {
      const res = await fetch(`${baseUrl}/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ title: 'Tampered Title' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /only update your own request/i);
    });

    it('prevents User 2 from deleting User 1 request', async () => {
      const res = await fetch(`${baseUrl}/api/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user2Token}`,
        },
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /only delete your own request/i);
    });

    it('prevents Requester (User 1) from responding to their own request', async () => {
      const res = await fetch(`${baseUrl}/api/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ reasons: ['I can help myself'] }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /cannot respond to your own request/i);
    });

    it('allows User 2 (helper) to respond to User 1 request', async () => {
      const res = await fetch(`${baseUrl}/api/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ reasons: ['Available nearby'] }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.message, 'Response recorded successfully.');
    });

    it('allows only the requester to list helper responses', async () => {
      const forbiddenRes = await fetch(`${baseUrl}/api/requests/${requestId}/responses`, {
        headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.equal(forbiddenRes.status, 400);
      assert.match((await forbiddenRes.json()).error, /only the requester/i);

      const responsesRes = await fetch(`${baseUrl}/api/requests/${requestId}/responses`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(responsesRes.status, 200);
      const body = await responsesRes.json();
      assert.equal(body.responses.length, 1);
      assert.equal(body.responses[0].helper.id, user2.id);
    });

    it('prevents User 2 from accepting a helper on User 1 request', async () => {
      const res = await fetch(`${baseUrl}/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ helperId: user2.id }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /only accept a helper on your own request/i);
    });

    it('prevents User 2 from completing User 1 request', async () => {
      const res = await fetch(`${baseUrl}/api/requests/${requestId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user2Token}`,
        },
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /only the requester can complete/i);
    });

    it('allows User 1 (requester) to accept helper and complete request', async () => {
      const acceptRes = await fetch(`${baseUrl}/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ helperId: user2.id }),
      });
      assert.equal(acceptRes.status, 200);

      const completeRes = await fetch(`${baseUrl}/api/requests/${requestId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });
      assert.equal(completeRes.status, 200);
      const body = await completeRes.json();
      assert.equal(body.request.status, 'completed');
    });
  });

  describe('7. Resource Ownership Authorization (Help Offers)', () => {
    let offerId;

    it('creates an offer for User 1', async () => {
      const res = await fetch(`${baseUrl}/api/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          category: 'Tutoring',
          description: 'Math tutoring available',
          latitude: 19.076,
          longitude: 72.8777,
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(body.offer.id);
      offerId = body.offer.id;
    });

    it('prevents User 2 from editing User 1 offer', async () => {
      const res = await fetch(`${baseUrl}/api/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ description: 'Tampered offer' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /only edit your own offer/i);
    });

    it('prevents User 2 from deleting User 1 offer', async () => {
      const res = await fetch(`${baseUrl}/api/offers/${offerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user2Token}`,
        },
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /only delete your own offer/i);
    });

    it('allows User 1 to edit their own offer', async () => {
      const res = await fetch(`${baseUrl}/api/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ description: 'Updated math tutoring' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.offer.description, 'Updated math tutoring');
    });
  });

  describe('8. Verification Authorization Gates', () => {
    it('blocks community verification if email is not verified first', async () => {
      const res = await fetch(`${baseUrl}/api/verification/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ code: 'TSEC-2026-X7K9' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /Email verification is required before community verification/i);
    });

    it('allows community verification once email is verified', async () => {
      // Manually set email_verified for user1 to test gate transition
      await query('UPDATE users SET email_verified = 1 WHERE id = ?', [user1.id]);

      // Invalid code test
      const badCodeRes = await fetch(`${baseUrl}/api/verification/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ code: 'WRONG-CODE' }),
      });
      assert.equal(badCodeRes.status, 400);
      const badBody = await badCodeRes.json();
      assert.match(badBody.error, /invalid community verification code/i);

      // Valid code test
      const goodCodeRes = await fetch(`${baseUrl}/api/verification/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ code: 'TSEC-2026-X7K9' }),
      });
      assert.equal(goodCodeRes.status, 200);
      const goodBody = await goodCodeRes.json();
      assert.equal(goodBody.user.communityVerified, true);
      assert.equal(goodBody.user.verification_status, 'VERIFIED');
    });
  });

  describe('9. Community modules use the authenticated identity', () => {
    let serviceId;
    let activityId;

    it('supports directory search, categories, service details, edit, and report', async () => {
      const createRes = await fetch(`${baseUrl}/api/community-tools/directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
        body: JSON.stringify({ name: 'Test Plumbing', category: 'plumber', area: 'Downtown', phone: '+1 555 123 4567' }),
      });
      assert.equal(createRes.status, 201);
      const service = await createRes.json();
      serviceId = service.id;
      assert.equal(service.addedBy.id, user1.id);

      const searchRes = await fetch(`${baseUrl}/api/community-tools/directory?q=plumbing&category=plumber` , {
        headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.equal(searchRes.status, 200);
      assert.ok((await searchRes.json()).items.some((item) => item.id === serviceId));

      const detailRes = await fetch(`${baseUrl}/api/community-tools/directory/${serviceId}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(detailRes.status, 200);
      assert.equal((await detailRes.json()).id, serviceId);

      const editRes = await fetch(`${baseUrl}/api/community-tools/directory/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
        body: JSON.stringify({ name: 'Updated Test Plumbing', baseUpdatedAt: service.updatedAt }),
      });
      assert.equal(editRes.status, 200);

      const reportRes = await fetch(`${baseUrl}/api/community-tools/directory/${serviceId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user2Token}` },
        body: JSON.stringify({ reason: 'other', details: 'Integration test report' }),
      });
      assert.equal(reportRes.status, 201);
    });

    it('supports activity create, details, join, leave, and organizer participant management', async () => {
      const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      const createRes = await fetch(`${baseUrl}/api/community-tools/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
        body: JSON.stringify({ title: 'Test clean-up drive', description: 'Community API check', category: 'clean_up', area: 'Downtown', date, time: '09:00', maxParticipants: 12, latitude: 40.7, longitude: -74.0 }),
      });
      assert.equal(createRes.status, 201);
      const activity = await createRes.json();
      activityId = activity.id;
      assert.equal(activity.organizer.id, user1.id);

      const joinRes = await fetch(`${baseUrl}/api/community-tools/activities/${activityId}/join`, {
        method: 'POST', headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.equal(joinRes.status, 200);
      assert.equal((await joinRes.json()).joined, true);

      const detailRes = await fetch(`${baseUrl}/api/community-tools/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(detailRes.status, 200);
      assert.equal((await detailRes.json()).participants.length, 2);

      const participantsRes = await fetch(`${baseUrl}/api/community-tools/activities/${activityId}/participants`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(participantsRes.status, 200);
      assert.equal((await participantsRes.json()).joinedCount, 2);

      const leaveRes = await fetch(`${baseUrl}/api/community-tools/activities/${activityId}/leave`, {
        method: 'POST', headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.equal(leaveRes.status, 200);
    });

    it('supports trust, reports, blocks, and admin authorization on the shared database', async () => {
      const trustRes = await fetch(`${baseUrl}/api/community-tools/trust/me`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(trustRes.status, 200);
      assert.equal(typeof (await trustRes.json()).trustScore, 'number');

      const peopleRes = await fetch(`${baseUrl}/api/community-tools/people?q=Bob`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(peopleRes.status, 200);
      assert.ok((await peopleRes.json()).items.some((person) => person.id === user2.id));

      const reportsRes = await fetch(`${baseUrl}/api/community-tools/reports/mine`, {
        headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.equal(reportsRes.status, 200);
      assert.equal((await reportsRes.json()).items.length, 1);

      const blockRes = await fetch(`${baseUrl}/api/community-tools/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
        body: JSON.stringify({ userId: user2.id }),
      });
      assert.equal(blockRes.status, 201);

      const deniedAdmin = await fetch(`${baseUrl}/api/community-tools/admin/stats`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(deniedAdmin.status, 403);

      await query('UPDATE users SET role = ? WHERE id = ?', ['admin', user1.id]);
      const adminStats = await fetch(`${baseUrl}/api/community-tools/admin/stats`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.equal(adminStats.status, 200);
      assert.ok('openReports' in await adminStats.json());
    });
  });
});
