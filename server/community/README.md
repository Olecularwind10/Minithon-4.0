# Community + Trust/Safety + Offline module

## Run the backend (5 min)
```bash
cd server
npm install
npm run seed      # demo users/services/activities/ratings
npm run dev       # http://localhost:4000/api
# try it (dev auth = x-user-id header; ids: u_admin, u_asha, u_ravi, u_meera, u_imran, u_priya)
curl -H "x-user-id: u_asha" "http://localhost:4000/api/directory?q=plumb"
curl -H "x-user-id: u_asha" http://localhost:4000/api/trust/u_asha
```

## Plug into the shared backend
```js
import { createCommunityRouter, idempotency } from './community/index.js';
app.use('/api', idempotency);                                        // once, before all routers
app.use('/api', createCommunityRouter({ authMiddleware: yourJwt })); // yourJwt must set req.user = { id }
```
If the team's `users` / `help_requests` / `ratings` / `messages` tables use different column names,
change the SQL in `trust.js`, `middleware.js` (loadUser) and `safety.js` (TARGETS). That's all.

## For Aniket (matching)
```js
import { computeTrust, computeTrustBulk, isBlocked } from './community/index.js';
const t = computeTrust(helperId); // { trustScore 0-100, breakdown, reasons[], badges[], confidence, ... }
if (isBlocked(requesterId, helperId)) skip;                          // never suggest blocked pairs
```
HTTP: `GET /api/trust/:userId`, `POST /api/trust/bulk {userIds:[]}`.
`t.reasons` can be shown directly in "Recommended because...".

## Endpoints
Requests: GET/POST /api/requests, POST /api/requests/:id/offer
Directory: GET/POST /api/directory, GET /api/directory/categories, GET/PUT /api/directory/:id, POST /api/directory/:id/report
Activities: GET/POST /api/activities, GET/PUT /api/activities/:id, POST /:id/join, /:id/leave, /:id/status, GET /:id/participants, DELETE /:id/participants/:userId, POST /:id/report
Trust: GET /api/trust/me, /api/trust/:userId, /:userId/reviews, /:userId/history, POST /api/trust/bulk
Safety: POST /api/reports (targetType: user|request|message|activity|service), GET /api/reports/mine, GET/POST /api/blocks, DELETE /api/blocks/:userId
Admin: GET /api/admin/stats, /reports, /reports/:id, PUT /reports/:id, POST /remove, GET /users, PUT /users/:id/status, PUT /users/:id/verification, GET /log

## Frontend (PWA)
```bash
npm i idb && npm i -D vite-plugin-pwa
```
1. Merge `frontend/vite.config.ts` into yours (PWA plugin + `/api` proxy). Keep your existing plugins.
2. Copy `frontend/src/pwa/*` and `frontend/public/pwa-*.png`.
3. Add the lines from `src/main.example.tsx` to your `main.tsx`; render `<OfflineBanner />` in your layout.
4. Replace direct API calls in create/join/edit/report handlers with `submitOrQueue` (see `src/pwa/exampleUsage.ts`).
5. Test the real thing: `npm run build && npm run preview` -> DevTools > Application > Service Workers > tick "Offline".
