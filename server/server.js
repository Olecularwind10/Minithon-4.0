import app from './app.js';
import { initializeDatabase } from './db/init.js';
import { env } from './config/env.js';

const startServer = async () => {
  await initializeDatabase();

  app.listen(env.port, () => {
    console.log(`Mansi backend listening on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start Mansi backend:', error);
  process.exit(1);
});
