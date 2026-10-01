import { getUserById, listActiveUsers, updateUserProfile } from '../services/authService.js';

export async function listUsers(_req, res) {
  try {
    const users = await listActiveUsers();
    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch users.' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = await getUserById(req.user?.sub, { includePrivate: true });
    return res.status(200).json({ user });
  } catch {
    return res.status(404).json({ error: 'User not found.' });
  }
}

export async function getUser(req, res) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch user.' });
  }
}

export async function updateUser(req, res) {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?.sub;

    if (targetUserId !== currentUserId) {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }

    const user = await updateUserProfile(targetUserId, req.body || {});
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Profile update failed.' });
  }
}
