import * as offerService from '../services/offerService.js';

export async function createOffer(req, res) {
  try {
    const offer = await offerService.createOffer(req.body || {}, req.user?.sub);
    return res.status(201).json({ offer });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create offer.' });
  }
}

export async function listOffers(req, res) {
  try {
    const offers = await offerService.listOffers({
      userId: req.query.userId,
      status: req.query.status,
      category: req.query.category,
    });
    return res.status(200).json({ offers });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load offers.' });
  }
}

export async function getOffer(req, res) {
  try {
    const offer = await offerService.getOfferById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }
    return res.status(200).json({ offer });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to fetch offer.' });
  }
}

export async function updateOffer(req, res) {
  try {
    const offer = await offerService.updateOffer(req.params.id, req.user?.sub, req.body || {});
    return res.status(200).json({ offer });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update offer.' });
  }
}

export async function deleteOffer(req, res) {
  try {
    const result = await offerService.deleteOffer(req.params.id, req.user?.sub);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to delete offer.' });
  }
}
