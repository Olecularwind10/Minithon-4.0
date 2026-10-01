import * as communityService from '../services/communityService.js';

export async function listActivities(req, res) {
  try {
    const activities = await communityService.listActivities({
      organizerId: req.query.organizerId,
      status: req.query.status,
      category: req.query.category,
    });
    return res.status(200).json({ activities });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load activities.' });
  }
}

export async function createActivity(req, res) {
  try {
    const activity = await communityService.createActivity({
      organizerId: req.user?.sub,
      ...req.body,
    });
    return res.status(201).json({ activity });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create activity.' });
  }
}

export async function getActivity(req, res) {
  try {
    const activity = await communityService.getActivity(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }
    return res.status(200).json({ activity });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to fetch activity.' });
  }
}

export async function updateActivity(req, res) {
  try {
    const activity = await communityService.updateActivity(req.params.id, req.user?.sub, req.body || {});
    return res.status(200).json({ activity });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update activity.' });
  }
}

export async function deleteActivity(req, res) {
  try {
    const result = await communityService.deleteActivity(req.params.id, req.user?.sub);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to delete activity.' });
  }
}
