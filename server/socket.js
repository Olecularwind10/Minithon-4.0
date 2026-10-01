import { Server } from 'socket.io';
import { verifyToken } from './services/authService.js';
import * as messageService from './services/messageService.js';

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  globalThis.__mansiSocket = io;

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication required for socket connection.'));
    }

    try {
      const payload = verifyToken(token);
      socket.user = payload;
      return next();
    } catch {
      return next(new Error('Invalid or expired socket token.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return;
      socket.join(String(conversationId));
    });

    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      socket.leave(String(conversationId));
    });

    socket.on('send_message', async ({ conversationId, content }, callback) => {
      try {
        const payload = await messageService.sendMessage({
          conversationId: String(conversationId || ''),
          senderId: socket.user.sub,
          content,
        });

        io.to(String(conversationId)).emit('new_message', payload.message);
        callback?.({ ok: true, message: payload.message });
      } catch (error) {
        callback?.({ ok: false, error: error.message || 'Unable to send message.' });
      }
    });

    socket.on('mark_conversation_read', async (conversationId, callback) => {
      try {
        const result = await messageService.markConversationRead(String(conversationId || ''), socket.user.sub);
        io.to(String(conversationId)).emit('messages_read', result);
        callback?.({ ok: true, ...result });
      } catch (error) {
        callback?.({ ok: false, error: error.message || 'Unable to mark messages as read.' });
      }
    });
  });

  return io;
}
