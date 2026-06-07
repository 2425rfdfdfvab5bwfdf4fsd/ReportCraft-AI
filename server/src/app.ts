import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { readOnlyGuard } from './middleware/readonly.middleware';
import agenciesRouter    from './routes/agencies';
import clientsRouter     from './routes/clients';
import reportsRouter     from './routes/reports';
import pdfRouter         from './routes/pdf';
import connectorsRouter  from './routes/connectors';
import webhooksRouter    from './routes/webhooks';
import teamRouter        from './routes/team';
import referralsRouter   from './routes/referrals';
import billingRouter     from './routes/billing';

const app = express();

// Trust the reverse proxy (Railway / Replit) so req.ip resolves correctly
app.set('trust proxy', 1);

// Security headers — CSP is managed at the CDN/Replit layer
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const frontendUrl = process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: frontendUrl === '*' ? true : [frontendUrl, /\.replit\.dev$/, /\.replit\.app$/],
  credentials: true,
}));

// ─── Rate limiters ────────────────────────────────────────────────────────────

/** Applied to all unauthenticated routes (e.g. webhooks) */
const ipLimiter = rateLimit({
  ...config.rateLimits.global,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Applied to all authenticated API routes, keyed by agencyId */
const authLimiter = rateLimit({
  ...config.rateLimits.auth,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as express.Request & { agencyId?: string }).agencyId || req.ip || 'unknown',
});

/** Strict limiter for the computationally-heavy report-generation endpoint */
const reportGenLimiter = rateLimit({
  ...config.rateLimits.reportGen,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as express.Request & { agencyId?: string }).agencyId || req.ip || 'unknown',
});

// ─── Body parsing ─────────────────────────────────────────────────────────────

// Webhooks need the raw body for signature verification — must come before express.json()
app.use('/api/webhooks', express.json({ type: '*/*' }), ipLimiter, webhooksRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Public routes (no auth) ──────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

/** Public shared-report endpoint — strips all internal/sensitive fields */
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

  const {
    agencyId, aiModel, narrativeRating, narrativeRatingSection,
    narrativeRatingNote, generationDurationMs, status, shareToken,
    ...publicReport
  } = report as Record<string, unknown>;

  res.json(publicReport);
});

// ─── Protected API routes ─────────────────────────────────────────────────────

app.use('/api', authLimiter, authMiddleware as express.RequestHandler);
app.use('/api', readOnlyGuard as express.RequestHandler);

app.use('/api/agencies',    agenciesRouter);
app.use('/api/clients',     clientsRouter);
app.post('/api/reports',    reportGenLimiter);   // strict limit on generation
app.use('/api/reports',     reportsRouter);
app.use('/api/reports',     pdfRouter);
app.use('/api/connectors',  connectorsRouter);
app.use('/api/team',        teamRouter);
app.use('/api/referrals',   referralsRouter);
app.use('/api/billing',     billingRouter);

// ─── Frontend (production) ────────────────────────────────────────────────────

const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

export default app;
