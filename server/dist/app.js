"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const auth_middleware_1 = require("./middleware/auth.middleware");
const readonly_middleware_1 = require("./middleware/readonly.middleware");
const agencies_1 = __importDefault(require("./routes/agencies"));
const clients_1 = __importDefault(require("./routes/clients"));
const reports_1 = __importDefault(require("./routes/reports"));
const pdf_1 = __importDefault(require("./routes/pdf"));
const connectors_1 = __importDefault(require("./routes/connectors"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const team_1 = __importDefault(require("./routes/team"));
const referrals_1 = __importDefault(require("./routes/referrals"));
const billing_1 = __importDefault(require("./routes/billing"));
const app = (0, express_1.default)();
// Trust the reverse proxy (Railway / Replit) so req.ip resolves correctly
app.set('trust proxy', 1);
// Security headers — CSP is managed at the CDN/Replit layer
app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const frontendUrl = process.env.FRONTEND_URL || '*';
app.use((0, cors_1.default)({
    origin: frontendUrl === '*' ? true : [frontendUrl, /\.replit\.dev$/, /\.replit\.app$/],
    credentials: true,
}));
// ─── Rate limiters ────────────────────────────────────────────────────────────
/** Applied to all unauthenticated routes (e.g. webhooks) */
const ipLimiter = (0, express_rate_limit_1.default)({
    ...config_1.config.rateLimits.global,
    standardHeaders: true,
    legacyHeaders: false,
});
/** Applied to all authenticated API routes, keyed by agencyId */
const authLimiter = (0, express_rate_limit_1.default)({
    ...config_1.config.rateLimits.auth,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.agencyId || req.ip || 'unknown',
});
/** Strict limiter for the computationally-heavy report-generation endpoint */
const reportGenLimiter = (0, express_rate_limit_1.default)({
    ...config_1.config.rateLimits.reportGen,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.agencyId || req.ip || 'unknown',
});
// ─── Body parsing ─────────────────────────────────────────────────────────────
// Webhooks need the raw body for signature verification — must come before express.json()
app.use('/api/webhooks', express_1.default.json({ type: '*/*' }), ipLimiter, webhooks_1.default);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Public routes (no auth) ──────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
/** Public shared-report endpoint — strips all internal/sensitive fields */
app.get('/api/public/reports/:shareToken', async (req, res) => {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('./lib/db')));
    const report = await prisma.report.findFirst({
        where: { shareToken: req.params.shareToken, shareEnabled: true },
        include: {
            client: { select: { name: true } },
            agency: { select: { name: true, logoUrl: true, brandColor: true } },
        },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    const { agencyId, aiModel, narrativeRating, narrativeRatingSection, narrativeRatingNote, generationDurationMs, status, shareToken, ...publicReport } = report;
    res.json(publicReport);
});
// ─── Protected API routes ─────────────────────────────────────────────────────
app.use('/api', authLimiter, auth_middleware_1.authMiddleware);
app.use('/api', readonly_middleware_1.readOnlyGuard);
app.use('/api/agencies', agencies_1.default);
app.use('/api/clients', clients_1.default);
app.post('/api/reports', reportGenLimiter); // strict limit on generation
app.use('/api/reports', reports_1.default);
app.use('/api/reports', pdf_1.default);
app.use('/api/connectors', connectors_1.default);
app.use('/api/team', team_1.default);
app.use('/api/referrals', referrals_1.default);
app.use('/api/billing', billing_1.default);
// ─── Frontend (production) ────────────────────────────────────────────────────
const distPath = path_1.default.join(__dirname, '../../client/dist');
app.use(express_1.default.static(distPath));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path_1.default.join(distPath, 'index.html'));
    }
});
exports.default = app;
//# sourceMappingURL=app.js.map