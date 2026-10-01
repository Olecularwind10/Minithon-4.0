// Standalone dev server so you can build/test your modules without waiting for the rest of the backend.
import express from 'express';
import cors from 'cors';
import { createCommunityRouter, idempotency } from './community/index.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
const apiInfo = {
	name: 'Neighborhood Help Community API',
	health: 'GET /api/health',
	routes: {
		requests: '/api/requests',
		directory: '/api/directory',
		activities: '/api/activities',
		trust: '/api/trust',
		reports: '/api/reports',
		blocks: '/api/blocks',
		admin: '/api/admin',
	},
};
app.get(['/', '/api'], (_req, res) => res.json(apiInfo));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', idempotency);
app.use('/api', createCommunityRouter());

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Community API on http://localhost:${port}/api`));
