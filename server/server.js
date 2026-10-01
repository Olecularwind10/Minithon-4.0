import http from 'node:http';
import app from './app.js';
import { initializeDatabase } from './db/init.js';
import { env } from './config/env.js';
import { setupSocket } from './socket.js';

const startServer = async () => {
  await initializeDatabase();

  const server = http.createServer(app);
  setupSocket(server);

  server.listen(env.port, () => {
    console.log(`Mansi backend listening on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start Mansi backend:', error);
  process.exit(1);
});
