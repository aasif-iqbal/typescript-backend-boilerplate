import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  try {
    // Verify database connectivity before accepting HTTP traffic
    await prisma.$connect();
    logger.info('Database connection established');

    server.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `Server running on http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const shutdown = async (signal: string): Promise<void> => {
  logger.warn({ signal }, `${signal} received. Closing HTTP server...`);

  // Stop accepting new incoming requests
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error closing HTTP server');
      process.exit(1);
    }

    try {
      logger.info('Closing database connection pools...');
      await prisma.$disconnect();
      // If using Redis: await redis.quit();

      logger.info('All connections cleanly terminated. Exiting process.');
      process.exit(0);
    } catch (cleanupError) {
      logger.error({ err: cleanupError }, 'Error during resource teardown');
      process.exit(1);
    }
  });

  // Force close process if open sockets don't drain within 10 seconds
  const forceKillTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing termination.');
    process.exit(1);
  }, 10000);

  forceKillTimer.unref();
};

// Process event listeners
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ err: reason }, 'Unhandled Rejection detected');
  throw reason; // Let uncaughtException handle clean termination
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught Exception detected');
  process.exit(1);
});

void startServer();