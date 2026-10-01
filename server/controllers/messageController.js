import * as messageService from '../services/messageService.js';

function emitRealtimeMessage(conversationId, payload) {
  if (globalThis.__mansiSocket && conversationId) {
    globalThis.__mansiSocket.to(String(conversationId)).emit('new_message', payload);
  }
}

export async function listConversations(req, res) {
  try {
    const conversations = await messageService.listConversations(req.user?.sub);
    return res.status(200).json({ conversations });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load conversations.' });
  }
}

export async function createConversation(req, res) {
  try {
    const otherUserId = String(req.body?.otherUserId || '').trim();
    const requestId = req.body?.requestId ? String(req.body.requestId).trim() : null;

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required.' });
    }

    const conversationResult = await messageService.ensureConversation({
      requestId,
      participantA: req.user?.sub,
      participantB: otherUserId,
    });

    return res.status(200).json(conversationResult);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create conversation.' });
  }
}

export async function getConversation(req, res) {
  try {
    const result = await messageService.getConversationDetails(req.params.id, req.user?.sub);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ error: error.message || 'Conversation not found.' });
  }
}

export async function sendMessage(req, res) {
  try {
    const result = await messageService.sendMessage({
      conversationId: req.params.id,
      senderId: req.user?.sub,
      content: req.body?.content,
    });

    emitRealtimeMessage(req.params.id, result.message);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to send message.' });
  }
}

export async function markConversationRead(req, res) {
  try {
    const result = await messageService.markConversationRead(req.params.id, req.user?.sub);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to mark conversation as read.' });
  }
}
