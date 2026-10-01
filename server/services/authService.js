import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { env } from '../config/env.js';
import { sendVerificationEmail } from './emailService.js';

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_ATTEMPT_LIMIT = 5;
const COMMUNITY_CODE = 'TSEC-2026-X7K9';

function parseJsonArray(value, fallback = []) {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function toPublicUser(user) {
  if (!user) return null;

  const safeUser = { ...user };
  delete safeUser.password_hash;
  delete safeUser.phone;
  delete safeUser.address;
  delete safeUser.otp_hash;
  delete safeUser.passwordHash;

  return {
    ...safeUser,
    skills: parseJsonArray(safeUser.skills, []),
    availability: parseJsonArray(safeUser.availability, []),
    emailVerified: Boolean(safeUser.email_verified),
    phoneVerified: Boolean(safeUser.phone_verified),
    communityVerified: Boolean(safeUser.community_verified),
  };
}

function toPrivateUser(user) {
  const safeUser = toPublicUser(user);
  if (!safeUser) return null;
  return { ...safeUser, phone: user.phone, address: user.address };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function createJwt(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      verificationStatus: user.verification_status || 'PENDING_VERIFICATION',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

function getUserByEmail(email) {
  return query('SELECT * FROM users WHERE email = ?', [String(email || '').trim().toLowerCase()]);
}

async function getLatestOtpForUser(userId) {
  const result = await query(
    'SELECT * FROM email_otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId],
  );
  return result.rows[0] || null;
}

async function createVerificationRecord({ userId, type, status, communityId = null, verifiedBy = null }) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO verification_records (id, user_id, type, status, community_id, verified_at, verified_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, userId, type, status, communityId, status === 'VERIFIED' ? new Date().toISOString() : null, verifiedBy],
  );
}

async function sendOtpEmail(userId, email, name) {
  const otp = String(crypto.randomInt(100000, 1000000)).padStart(6, '0');
  const otpHash = await bcrypt.hash(otp, 12);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS).toISOString();

  await query('DELETE FROM email_otps WHERE user_id = ?', [userId]);
  await query(
    `INSERT INTO email_otps (id, user_id, otp_hash, expires_at, attempts, last_sent_at, created_at)
     VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
    [crypto.randomUUID(), userId, otpHash, expiresAt, new Date().toISOString()],
  );

  try {
    await sendVerificationEmail({ to: email, name, otp });
  } catch (error) {
    console.warn('[authService] Failed to send verification email:', error.message);
  }
}

export async function registerUser(input = {}) {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const address = String(input.address || '').trim() || null;

  if (!name) throw new Error('Name is required.');
  if (!isValidEmail(email)) throw new Error('A valid email is required.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');

  const existing = await getUserByEmail(email);
  if (existing.rows.length > 0) {
    throw new Error('A user with this email already exists.');
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const phone = input.phone ? String(input.phone).trim() : null;

  await query(
    `INSERT INTO users (
      id, name, email, password_hash, phone, profile_image, latitude, longitude, area, address,
      skills, availability, rating, completed_requests, email_verified, phone_verified,
      community_verified, community_id, verification_status, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, NULL, 'PENDING_VERIFICATION', 'active', CURRENT_TIMESTAMP)`,
    [
      userId,
      name,
      email,
      passwordHash,
      phone,
      input.profileImage || null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.area || null,
      address,
      JSON.stringify(input.skills || []),
      JSON.stringify(input.availability || []),
    ],
  );

  const userResult = await query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = userResult.rows[0];

  await sendOtpEmail(userId, email, name);

  return {
    user: toPublicUser(user),
    token: createJwt(user),
  };
}

export async function loginUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const result = await getUserByEmail(normalizedEmail);
  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!passwordMatches) {
    throw new Error('Invalid email or password.');
  }

  return {
    user: toPublicUser(user),
    token: createJwt(user),
  };
}

export async function getUserById(id, { includePrivate = false } = {}) {
  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return includePrivate ? toPrivateUser(result.rows[0] || null) : toPublicUser(result.rows[0] || null);
}

export async function updateUserProfile(id, updates = {}) {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (['name', 'phone', 'profileImage', 'latitude', 'longitude', 'area', 'address', 'skills', 'availability'].includes(key)) {
      fields.push(`${toColumnName(key)} = ?`);
      values.push(key === 'skills' || key === 'availability' ? JSON.stringify(value || []) : value);
    }
  }

  if (!fields.length) {
    return getUserById(id, { includePrivate: true });
  }

  values.push(id);
  await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return getUserById(id, { includePrivate: true });
}

function toColumnName(key) {
  const map = {
    name: 'name',
    phone: 'phone',
    profileImage: 'profile_image',
    latitude: 'latitude',
    longitude: 'longitude',
    area: 'area',
    address: 'address',
    skills: 'skills',
    availability: 'availability',
  };

  return map[key] || key;
}

export async function resendEmailOtp({ userId }) {
  if (!userId) throw new Error('User ID is required.');

  const userResult = await query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = userResult.rows[0];
  if (!user) throw new Error('User not found.');

  const existingOtp = await getLatestOtpForUser(userId);
  if (existingOtp && new Date(existingOtp.last_sent_at || existingOtp.created_at).getTime() + OTP_RESEND_COOLDOWN_MS > Date.now()) {
    throw new Error('Please wait before requesting another verification email.');
  }

  await sendOtpEmail(user.id, user.email, user.name);

  return {
    message: 'A new email verification code has been sent.',
  };
}

export async function verifyEmailOtp({ userId, otp }) {
  if (!userId || !otp) {
    throw new Error('User ID and OTP are required.');
  }

  const otpRecord = await getLatestOtpForUser(userId);
  if (!otpRecord) {
    throw new Error('No active verification code was found for this user.');
  }

  if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
    await query('DELETE FROM email_otps WHERE id = ?', [otpRecord.id]);
    throw new Error('The verification code has expired. Please request a new one.');
  }

  if (Number(otpRecord.attempts || 0) >= OTP_ATTEMPT_LIMIT) {
    throw new Error('Too many invalid attempts. Please request a new verification code.');
  }

  const matches = await bcrypt.compare(String(otp).trim(), otpRecord.otp_hash);
  if (!matches) {
    const nextAttempts = Number(otpRecord.attempts || 0) + 1;
    await query('UPDATE email_otps SET attempts = ? WHERE id = ?', [nextAttempts, otpRecord.id]);
    throw new Error(`Invalid OTP. ${Math.max(0, OTP_ATTEMPT_LIMIT - nextAttempts)} attempts remaining.`);
  }

  await query(
    `UPDATE users
     SET email_verified = 1,
         verification_status = CASE WHEN community_verified = 1 THEN 'VERIFIED' ELSE 'PENDING_VERIFICATION' END
     WHERE id = ?`,
    [userId],
  );

  await createVerificationRecord({ userId, type: 'EMAIL', status: 'VERIFIED', verifiedBy: 'email-verification' });
  await query('DELETE FROM email_otps WHERE user_id = ?', [userId]);

  const updatedUser = (await query('SELECT * FROM users WHERE id = ?', [userId])).rows[0];

  return {
    message: 'Email verified successfully.',
    user: toPublicUser(updatedUser),
  };
}

export async function verifyCommunityCode({ userId, code }) {
  if (!userId) throw new Error('User ID is required.');
  if (!code) throw new Error('Community verification code is required.');

  const userResult = await query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = userResult.rows[0];
  if (!user) throw new Error('User not found.');
  if (!Number(user.email_verified)) {
    throw new Error('Email verification is required before community verification.');
  }

  const normalizedCode = String(code).trim().toUpperCase();
  if (normalizedCode !== COMMUNITY_CODE) {
    await createVerificationRecord({ userId, type: 'COMMUNITY', status: 'REJECTED', verifiedBy: 'mock-community-check' });
    throw new Error('Invalid community verification code.');
  }

  await query(
    `UPDATE users
     SET community_verified = 1,
         community_id = 'TSEC',
         verification_status = 'VERIFIED'
     WHERE id = ?`,
    [userId],
  );

  await createVerificationRecord({
    userId,
    type: 'COMMUNITY',
    status: 'VERIFIED',
    communityId: 'TSEC',
    verifiedBy: 'mock-community-check',
  });

  const updatedUser = (await query('SELECT * FROM users WHERE id = ?', [userId])).rows[0];

  return {
    message: 'Community verification succeeded.',
    user: toPublicUser(updatedUser),
  };
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function createToken(user) {
  return createJwt(user);
}
