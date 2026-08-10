import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { sanitizeRequest } from './middlewares/sanitize.middleware';
import attendanceRoutes from './routes/attendance.routes';
import authRoutes from './routes/auth.routes';
import bulkImportRoutes from './routes/bulkImport.routes';
import churchRoutes from './routes/church.routes';
import dashboardRoutes from './routes/dashboard.routes';
import goalRoutes from './routes/goal.routes';
import groupRoutes from './routes/group.routes';
import memberRoutes from './routes/member.routes';
import metricRoutes from './routes/metric.routes';
import reportRoutes from './routes/report.routes';
import studentRoutes from './routes/student.routes';
import userRoutes from './routes/user.routes';
import logger from './utils/logger';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'script-src-attr': ["'none'"],
          'style-src': ["'self'"],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'font-src': ["'self'", 'data:'],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': [],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      frameguard: { action: 'deny' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      noSniff: true,
      hidePoweredBy: true,
      ieNoOpen: true,
      originAgentCluster: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeRequest);

  app.use(express.static(path.join(process.cwd(), 'public'), { index: false, maxAge: '1h' }));

  const origins = [env.cors.frontendUrl, ...env.cors.allowedOrigins];
  app.use(
    cors({
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(
    morgan('combined', {
      stream: {
        write: (message: string): void => {
          logger.info(message.trim());
        },
      },
    }),
  );

  const basePath = `${env.apiBasePath}/${env.apiVersion}`;
  app.use(`${basePath}/auth`, authRoutes);
  app.use(`${basePath}/churches`, churchRoutes);
  app.use(`${basePath}/import`, bulkImportRoutes);
  app.use(`${basePath}/groups`, groupRoutes);
  app.use(`${basePath}/members`, memberRoutes);
  app.use(`${basePath}/students`, studentRoutes);
  app.use(`${basePath}/metrics`, metricRoutes);
  app.use(`${basePath}/reports`, reportRoutes);
  app.use(`${basePath}/attendance`, attendanceRoutes);
  app.use(`${basePath}/goals`, goalRoutes);
  app.use(`${basePath}/dashboard`, dashboardRoutes);
  app.use(`${basePath}/users`, userRoutes);

  app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
