import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { authMiddleware } from './middleware/auth.middleware';
import agenciesRouter from './routes/agencies';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';
import pdfRouter from './routes/pdf';
import connectorsRouter from './routes/connectors';
import webhooksRouter from './routes/webhooks';
import teamRouter from './routes/team';

const app = express();

// Trust proxy (for Railway/Replit)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for SPA
  crossOriginEmbedderPolicy: false,
}));

const frontendUrl = process.env.FRONTEND_URL || '*';

app.use(cors({
  origin: frontendUrl === '*' ? true : [frontendUrl, /\.replit\.dev$/, /\.replit\.app$/],
  credentials: true,
}));

// Rate limiting
const ipLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => (req as any).agencyId || req.ip || 'unknown',
});

// Webhook routes (raw body needed for signature verification)
app.use('/api/webhooks', express.json({ type: '*/*' }), ipLimiter, webhooksRouter);

// Parse JSON for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth, no DB query)
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public report route (no auth)
app.get('/api/public/reports/:shareToken', async (req, res) => {
  const { prisma } = await import('./lib/db');
  const report = await prisma.report.findFirst({
    where: { shareToken: req.params.shareToken, shareEnabled: true },
    include: {
      client: { select: { name: true } },
      agency: { select: { name: true, logoUrl: true, brandColor: true } },
    },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

// Protected API routes
app.use('/api', authLimiter, authMiddleware as any);
app.use('/api/agencies', agenciesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/reports', pdfRouter);
app.use('/api/connectors', connectorsRouter);
app.use('/api/team', teamRouter);

// Serve React frontend in production
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

export default app;
