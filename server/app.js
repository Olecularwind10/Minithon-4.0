import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import verificationRoutes from './routes/verification.js';
import requestRoutes from './routes/requests.js';
import offerRoutes from './routes/offers.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import ratingRoutes from './routes/ratings.js';
import communityRoutes from './routes/community.js';
import reportRoutes from './routes/reports.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'mansi-backend',
    status: 'up',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      requests: '/api/requests',
      offers: '/api/offers',
      messages: '/api/messages',
      notifications: '/api/notifications',
      ratings: '/api/ratings',
      community: '/api/community',
      reports: '/api/reports',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mansi-backend', status: 'up' });
});

app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
