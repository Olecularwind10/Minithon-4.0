import * as requestService from '../services/requestService.js';

export async function createRequest(req, res) {
  try {
    const request = await requestService.createRequest(req.body || {}, req.user?.sub);
    return res.status(201).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create request.' });
  }
}

export async function listRequests(req, res) {
  try {
    const requests = await requestService.listRequests({
      requesterId: req.query.requesterId,
      status: req.query.status,
      category: req.query.category,
    });
    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load requests.' });
  }
}

export async function getRequest(req, res) {
  try {
    const request = await requestService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    return res.status(200).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to fetch request.' });
  }
}

export async function updateRequest(req, res) {
  try {
    const request = await requestService.updateRequest(req.params.id, req.user?.sub, req.body || {});
    return res.status(200).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update request.' });
  }
}

export async function deleteRequest(req, res) {
  try {
    const result = await requestService.deleteRequest(req.params.id, req.user?.sub);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to delete request.' });
  }
}

export async function respondToRequest(req, res) {
  try {
    const result = await requestService.respondToRequest(req.params.id, req.user?.sub, req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to respond to request.' });
  }
}

export async function acceptHelper(req, res) {
  try {
    const request = await requestService.acceptHelper(req.params.id, req.user?.sub, req.body?.helperId);
    return res.status(200).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to accept helper.' });
  }
}

export async function cancelRequest(req, res) {
  try {
    const request = await requestService.cancelRequest(req.params.id, req.user?.sub);
    return res.status(200).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to cancel request.' });
  }
}

export async function completeRequest(req, res) {
  try {
    const request = await requestService.completeRequest(req.params.id, req.user?.sub);
    return res.status(200).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to complete request.' });
  }
}
