import crypto from 'node:crypto';
import { query } from '../config/database.js';

function toBoolean(value) {
  return Number(value || 0) === 1;
}

function normalizeMessage(row) {
  if (!row) return null;
  return {
    ...row,
    readStatus: Number(row.read_status || 0),
    read: toBoolean(row.read_status),
    createdAt: row.created_at,
  };
}

function normalizeConversation(row) {
  if (!row) return null;
  return {
    ...row,
    unreadCount: Number(row.unread_count || 0),
    createdAt: row.created_at,
    lastMessage: row.last_message ? {
      content: row.last_message,
      createdAt: row.last_message_time,
    } : null,
  };
}

async function getConversationRow(conversationId) {
  const result = await query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
  return result.rows[0] || null;
}

async function getParticipantNames(participantA, participantB) {
  const [aResult, bResult] = await Promise.all([
    query('SELECT id, name, profile_image FROM users WHERE id = ?', [participantA]),
    query('SELECT id, name, profile_image FROM users WHERE id = ?', [participantB]),
  ]);

  return {
    participantAUser: aResult.rows[0] || null,
    participantBUser: bResult.rows[0] || null,
  };
}

export async function ensureConversation({ requestId = null, participantA, participantB }) {
  if (!participantA || !participantB) {
    throw new Error('Both participants are required for a conversation.');
  }
  if (participantA === participantB) {
    throw new Error('A conversation cannot be created with the same user on both sides.');
  }

  const existingResult = await query(
    `SELECT * FROM conversations
     WHERE (
       (participant_a = ? AND participant_b = ?) OR
       (participant_a = ? AND participant_b = ?)
     )
     ORDER BY created_at DESC LIMIT 1`,
    [participantA, participantB, participantB, participantA],
  );

  if (existingResult.rows[0]) {
    return getConversationDetails(existingResult.rows[0].id, participantA);
  }

  const conversationId = crypto.randomUUID();
  await query(
    'INSERT INTO conversations (id, request_id, participant_a, participant_b, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [conversationId, requestId || null, participantA, participantB],
  );

  return getConversationDetails(conversationId, participantA);
}

export async function listConversations(userId) {
  const result = await query(
    `SELECT c.*,
      CASE WHEN c.participant_a = ? THEN u_b.name ELSE u_a.name END AS other_user_name,
      CASE WHEN c.participant_a = ? THEN u_b.id ELSE u_a.id END AS other_user_id,
      CASE WHEN c.participant_a = ? THEN u_b.profile_image ELSE u_a.profile_image END AS other_user_profile_image,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read_status = 0) AS unread_count,
      (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time
    FROM conversations c
    LEFT JOIN users u_a ON u_a.id = c.participant_a
    LEFT JOIN users u_b ON u_b.id = c.participant_b
    WHERE c.participant_a = ? OR c.participant_b = ?
    ORDER BY c.created_at DESC`,
    [userId, userId, userId, userId, userId, userId],
  );

  return (result.rows || []).map((row) => normalizeConversation(row));
}

export async function getConversationDetails(conversationId, userId) {
  const conversation = await getConversationRow(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  if (conversation.participant_a !== userId && conversation.participant_b !== userId) {
    throw new Error('You are not a participant in this conversation.');
  }

  const result = await query(
    `SELECT c.*,
      CASE WHEN c.participant_a = ? THEN u_b.name ELSE u_a.name END AS other_user_name,
      CASE WHEN c.participant_a = ? THEN u_b.id ELSE u_a.id END AS other_user_id,
      CASE WHEN c.participant_a = ? THEN u_b.profile_image ELSE u_a.profile_image END AS other_user_profile_image
    FROM conversations c
    LEFT JOIN users u_a ON u_a.id = c.participant_a
    LEFT JOIN users u_b ON u_b.id = c.participant_b
    WHERE c.id = ?`,
    [userId, userId, userId, conversationId],
  );

  const conversationRow = result.rows[0] || null;
  if (!conversationRow) {
    throw new Error('Conversation not found.');
  }

  const messagesResult = await query(
    `SELECT m.*
     FROM messages m
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    [conversationId],
  );

  const participants = await getParticipantNames(conversation.participant_a, conversation.participant_b);

  return {
    conversation: {
      ...conversationRow,
      createdAt: conversationRow.created_at,
      otherUserName: conversationRow.other_user_name,
      otherUserId: conversationRow.other_user_id,
      otherUserProfileImage: conversationRow.other_user_profile_image,
      participantAUser: participants.participantAUser,
      participantBUser: participants.participantBUser,
    },
    messages: (messagesResult.rows || []).map(normalizeMessage),
  };
}

export async function sendMessage({ conversationId, senderId, content }) {
  const trimmed = String(content || '').trim();
  if (!conversationId || !senderId) {
    throw new Error('Conversation ID and sender ID are required.');
  }
  if (!trimmed) {
    throw new Error('Message content cannot be empty.');
  }

  const conversation = await getConversationRow(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }
  if (conversation.participant_a !== senderId && conversation.participant_b !== senderId) {
    throw new Error('You are not allowed to send messages in this conversation.');
  }

  const messageId = crypto.randomUUID();
  await query(
    `INSERT INTO messages (id, conversation_id, sender_id, content, read_status, created_at)
     VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
    [messageId, conversationId, senderId, trimmed],
  );

  const result = await query('SELECT * FROM messages WHERE id = ?', [messageId]);
  const message = normalizeMessage(result.rows[0]);
  return { message };
}

export async function markConversationRead(conversationId, userId) {
  const conversation = await getConversationRow(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }
  if (conversation.participant_a !== userId && conversation.participant_b !== userId) {
    throw new Error('You are not a participant in this conversation.');
  }

  await query(
    'UPDATE messages SET read_status = 1 WHERE conversation_id = ? AND sender_id != ? AND read_status = 0',
    [conversationId, userId],
  );

  return {
    success: true,
    conversationId,
    readBy: userId,
  };
}
