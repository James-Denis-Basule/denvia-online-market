import app from './app.js';
import env from './config/env.js';
import connectDatabase from './config/database.js';

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`DOM API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start DOM server:', error);
    process.exit(1);
  }
}

startServer();