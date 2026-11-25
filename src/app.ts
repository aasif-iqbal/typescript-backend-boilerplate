import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js'; 

export const app: Application = express();

// 1. Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// 2. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Request Tracing & Structured HTTP Logging
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] as string,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

// 4. Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 5. Mount API Routes
app.use('/api/v1', apiRouter);

// 6. 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: 'Route not found',
  });
});

// 7. Global Centralized Error Handling Middleware
app.use(errorHandler);