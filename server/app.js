import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import verificationRoutes from './routes/verification.js';
import requestRoutes from './routes/requests.js';
import offerRoutes from './routes/offers.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mansi-backend', status: 'up' });
});

app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
