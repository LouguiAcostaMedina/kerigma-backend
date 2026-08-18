import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { audit } from './middlewares/audit.middleware';
import { sanitizeRequest } from './middlewares/sanitize.middleware';
import attendanceRoutes from './routes/attendance.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import auditRoutes from './routes/audit.routes';
import authRoutes from './routes/auth.routes';
import bulkImportRoutes from './routes/bulkImport.routes';
import catalogRoutes from './routes/catalog.routes';
import churchRoutes from './routes/church.routes';
import dashboardRoutes from './routes/dashboard.routes';
import dataProtectionRoutes from './routes/dataProtection.routes';
import financialRoutes from './routes/financial.routes';
import groupRoutes from './routes/group.routes';
import memberRoutes from './routes/member.routes';
import reportRoutes from './routes/report.routes';
import studentRoutes from './routes/student.routes';
import userRoutes from './routes/user.routes';
import hierarchyRoutes from './routes/hierarchy.routes';
import ministryRoutes from './routes/ministry.routes';
import pastoralCareRoutes from './routes/pastoralCare.routes';
import documentRoutes from './routes/document.routes';
import baptismPipelineRoutes from './routes/baptismPipeline.routes';
import clientRoutes from './routes/client.routes';
import paymentRoutes from './routes/payment.routes';
import featureFlagRoutes from './routes/featureFlag.routes';
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
  const auditWritable = audit();
  app.use(`${basePath}/auth`, authRoutes);
  app.use(`${basePath}/catalog`, catalogRoutes);
  app.use(`${basePath}/churches`, auditWritable, churchRoutes);
  app.use(`${basePath}/import`, bulkImportRoutes);
  app.use(`${basePath}/groups`, auditWritable, groupRoutes);
  app.use(`${basePath}/members`, auditWritable, memberRoutes);
  app.use(`${basePath}/data-protection`, dataProtectionRoutes);
  app.use(`${basePath}/financial-contributions`, auditWritable, financialRoutes);
  app.use(`${basePath}/students`, auditWritable, studentRoutes);
  app.use(`${basePath}/reports`, auditWritable, reportRoutes);
  app.use(`${basePath}/attendance`, auditWritable, attendanceRoutes);
  app.use(`${basePath}/activities`, auditWritable, activityRoutes);
  app.use(`${basePath}/notifications`, auditWritable, notificationRoutes);
  app.use(`${basePath}/hierarchy`, auditWritable, hierarchyRoutes);
  app.use(`${basePath}/ministries`, auditWritable, ministryRoutes);
  app.use(`${basePath}/pastoral-care`, auditWritable, pastoralCareRoutes);
  app.use(`${basePath}/documents`, auditWritable, documentRoutes);
  app.use(`${basePath}/baptism-pipeline`, baptismPipelineRoutes);
  app.use(`${basePath}/clients`, clientRoutes);
  app.use(`${basePath}/payments`, auditWritable, paymentRoutes);
  app.use(`${basePath}/dashboard`, dashboardRoutes);
  app.use(`${basePath}/audit-logs`, auditRoutes);
  app.use(`${basePath}/feature-flags`, featureFlagRoutes);
  app.use(`${basePath}/users`, auditWritable, userRoutes);

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
