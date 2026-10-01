import * as ratingService from '../services/ratingService.js';

export async function submitRating(req, res) {
  try {
    const rating = await ratingService.submitRating({
      requestId: req.body?.requestId,
      reviewerId: req.user?.sub,
      reviewedUserId: req.body?.reviewedUserId,
      rating: req.body?.rating,
      comment: req.body?.comment,
    });

    return res.status(201).json(rating);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to submit rating.' });
  }
}

export async function listRatingsForUser(req, res) {
  try {
    const ratings = await ratingService.listRatingsForUser(req.params.userId);
    return res.status(200).json({ ratings });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load ratings.' });
  }
}

export async function listRatingsForRequest(req, res) {
  try {
    const ratings = await ratingService.listRatingsForRequest(req.params.requestId);
    return res.status(200).json({ ratings });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load request ratings.' });
  }
}
