import {
  getUserById,
  loginUser,
  registerUser,
  resendEmailOtp,
  verifyCommunityCode,
  verifyEmailOtp,
} from '../services/authService.js';

export async function register(req, res) {
  try {
    const result = await registerUser(req.body || {});
    return res.status(201).json({
      message: 'Registration successful. Please verify your email to complete setup.',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Registration failed.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const result = await loginUser(email, password);
    return res.status(200).json({
      message: 'Login successful.',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(401).json({ error: error.message || 'Invalid credentials.' });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { userId, otp } = req.body || {};
    const result = await verifyEmailOtp({ userId, otp });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Email verification failed.' });
  }
}

export async function resendEmailOtpController(req, res) {
  try {
    const { userId } = req.body || {};
    const result = await resendEmailOtp({ userId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to resend email OTP.' });
  }
}

export function logout(_req, res) {
  return res.status(200).json({ message: 'Logged out successfully.' });
}

export async function me(req, res) {
  try {
    const user = await getUserById(req.user?.sub);
    return res.status(200).json({ user });
  } catch {
    return res.status(404).json({ error: 'User not found.' });
  }
}

export async function verifyCommunity(req, res) {
  try {
    const { code } = req.body || {};
    const result = await verifyCommunityCode({ userId: req.user?.sub, code });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Community verification failed.' });
  }
}
