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
const express_1 = require("express");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../lib/db"));
const ai_service_1 = require("../services/ai.service");
const router = (0, express_1.Router)();
const createReportSchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    dateRangeStart: zod_1.z.string(),
    dateRangeEnd: zod_1.z.string(),
    narrativeTone: zod_1.z.enum(['professional', 'conversational', 'executive']).optional(),
});
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const clientId = req.query.clientId;
    const where = { agencyId: req.agencyId };
    if (clientId)
        where.clientId = clientId;
    const [reports, total] = await Promise.all([
        db_1.default.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { client: { select: { id: true, name: true } } },
        }),
        db_1.default.report.count({ where }),
    ]);
    res.json({ reports, total });
});
const AI_REPORT_MONTHLY_LIMITS = {
    FREE_TRIAL: Infinity,
    STARTER: 5,
    AGENCY: Infinity,
    AGENCY_PRO: Infinity,
};
router.post('/', async (req, res) => {
    try {
        const data = createReportSchema.parse(req.body);
        const client = await db_1.default.client.findFirst({
            where: { id: data.clientId, agencyId: req.agencyId },
        });
        if (!client)
            return res.status(404).json({ error: 'Client not found' });
        // Check for existing generating report
        const existing = await db_1.default.report.findFirst({
            where: {
                clientId: data.clientId,
                dateRangeStart: new Date(data.dateRangeStart),
                dateRangeEnd: new Date(data.dateRangeEnd),
                status: 'generating',
            },
        });
        if (existing) {
            return res.status(409).json({ error: 'A report is already being generated for this client and date range.' });
        }
        const agency = await db_1.default.agency.findUnique({ where: { id: req.agencyId } });
        // Enforce AI report monthly limit
        const monthlyLimit = AI_REPORT_MONTHLY_LIMITS[agency?.subscriptionTier || 'FREE_TRIAL'] ?? 5;
        if (isFinite(monthlyLimit) && (agency?.aiReportsUsedThisMonth ?? 0) >= monthlyLimit) {
            return res.status(403).json({
                error: 'REPORT_LIMIT_REACHED',
                used: agency?.aiReportsUsedThisMonth,
                limit: monthlyLimit,
                upgradeUrl: '/settings/billing',
                message: `You've used all ${monthlyLimit} AI reports for this month. Upgrade for unlimited reports.`,
            });
        }
        const report = await db_1.default.report.create({
            data: {
                agencyId: req.agencyId,
                clientId: data.clientId,
                dateRangeStart: new Date(data.dateRangeStart),
                dateRangeEnd: new Date(data.dateRangeEnd),
                narrativeTone: data.narrativeTone || agency?.narrativeTone || 'professional',
                status: 'generating',
            },
        });
        // Run generation async
        generateReportAsync(report.id, client, data.narrativeTone || agency?.narrativeTone || 'professional');
        res.status(201).json({ id: report.id, status: 'generating' });
    }
    catch (e) {
        if (e.name === 'ZodError')
            return res.status(400).json({ error: e.errors });
        throw e;
    }
});
async function generateReportAsync(reportId, client, tone) {
    const startTime = Date.now();
    try {
        const rawData = generateMockData();
        let narrativeResult;
        let aiModel = 'mock';
        const hasAI = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (hasAI) {
            try {
                const result = await (0, ai_service_1.generateNarrative)(rawData, tone, client.name, client.goals);
                narrativeResult = result.result;
                aiModel = result.model;
            }
            catch (e) {
                narrativeResult = (0, ai_service_1.generateMockNarrative)(client.name);
                aiModel = 'mock_fallback';
            }
        }
        else {
            narrativeResult = (0, ai_service_1.generateMockNarrative)(client.name);
        }
        // Count total words across all narrative sections and add metadata
        const totalWords = Object.values(narrativeResult)
            .filter((v) => typeof v === 'string')
            .join(' ')
            .split(/\s+/)
            .filter(Boolean).length;
        const narrativeWithMeta = {
            ...narrativeResult,
            wordCount: totalWords,
            generatedAt: new Date().toISOString(),
        };
        await db_1.default.report.update({
            where: { id: reportId },
            data: {
                status: 'ready',
                rawData: rawData,
                narrative: narrativeWithMeta,
                aiModel,
                generationDurationMs: Date.now() - startTime,
            },
        });
        // Update client lastReportAt and increment AI usage counter
        await Promise.all([
            db_1.default.client.update({ where: { id: client.id }, data: { lastReportAt: new Date() } }),
            db_1.default.agency.update({ where: { id: client.agencyId }, data: { aiReportsUsedThisMonth: { increment: 1 } } }),
        ]);
    }
    catch (e) {
        console.error('Report generation failed:', e);
        await db_1.default.report.update({
            where: { id: reportId },
            data: { status: 'error' },
        });
    }
}
function generateMockData() {
    const rand = (base, variance) => base + (Math.random() - 0.5) * variance;
    return {
        ga4: {
            sessions: Math.round(rand(12400, 2000)),
            sessionsPrev: Math.round(rand(11000, 2000)),
            bounceRate: rand(0.42, 0.1),
            bounceRatePrev: rand(0.45, 0.1),
            users: Math.round(rand(9800, 1500)),
            usersPrev: Math.round(rand(8900, 1500)),
            pageviews: Math.round(rand(34000, 5000)),
            pageviewsPrev: Math.round(rand(31000, 5000)),
            avgSessionDuration: rand(145, 30),
            avgSessionDurationPrev: rand(132, 30),
            conversionRate: rand(0.038, 0.01),
            conversionRatePrev: rand(0.034, 0.01),
        },
        googleAds: {
            impressions: Math.round(rand(280000, 50000)),
            impressionsPrev: Math.round(rand(260000, 50000)),
            clicks: Math.round(rand(7560, 1000)),
            clicksPrev: Math.round(rand(6800, 1000)),
            ctr: rand(0.027, 0.005),
            ctrPrev: rand(0.023, 0.005),
            spend: rand(4200, 500),
            spendPrev: rand(4050, 500),
            cpc: rand(0.56, 0.1),
            cpcPrev: rand(0.61, 0.1),
            conversions: Math.round(rand(287, 50)),
            conversionsPrev: Math.round(rand(231, 50)),
            conversionRate: rand(0.038, 0.01),
            conversionRatePrev: rand(0.034, 0.01),
            roas: rand(4.2, 0.8),
            roasPrev: rand(3.8, 0.8),
        },
        meta: {
            impressions: Math.round(rand(890000, 100000)),
            impressionsPrev: Math.round(rand(920000, 100000)),
            reach: Math.round(rand(234000, 30000)),
            reachPrev: Math.round(rand(241000, 30000)),
            clicks: Math.round(rand(4230, 500)),
            clicksPrev: Math.round(rand(4890, 500)),
            ctr: rand(0.0047, 0.001),
            ctrPrev: rand(0.0053, 0.001),
            spend: rand(3800, 400),
            spendPrev: rand(3650, 400),
            cpm: rand(4.27, 0.5),
            cpmPrev: rand(3.97, 0.5),
            roas: rand(2.8, 0.5),
            roasPrev: rand(3.1, 0.5),
        },
    };
}
router.get('/:id', async (req, res) => {
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
        include: {
            client: { select: { id: true, name: true, contactEmail: true, contactName: true } },
            agency: { select: { id: true, name: true, brandColor: true, logoUrl: true, narrativeTone: true } },
            deliveries: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, status: true, sentAt: true, createdAt: true },
            },
        },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    res.json(report);
});
router.post('/:id/regenerate-narrative', async (req, res) => {
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
        include: { client: true },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    const tone = req.body.tone || report.narrativeTone;
    // Persist the new tone so the UI reflects it after reload
    await db_1.default.report.update({
        where: { id: report.id },
        data: { status: 'generating', narrativeTone: tone },
    });
    generateReportAsync(report.id, report.client, tone);
    res.json({ id: report.id, status: 'generating', narrativeTone: tone });
});
router.post('/:id/export-pdf', async (req, res) => {
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
        include: {
            client: { select: { id: true, name: true, contactEmail: true, contactName: true } },
            agency: {
                select: {
                    id: true, name: true, brandColor: true, logoUrl: true,
                    subscriptionTier: true, narrativeTone: true,
                },
            },
        },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'ready') {
        return res.status(400).json({ error: 'Report is not ready for export', status: report.status });
    }
    try {
        const { generatePDF } = await Promise.resolve().then(() => __importStar(require('../services/pdf.service')));
        const pdfBuffer = await generatePDF(report, report.agency, report.client);
        const clientSlug = (report.client?.name || 'Report').replace(/\s+/g, '-');
        const dateSlug = new Date(report.dateRangeStart).toISOString().slice(0, 10);
        const filename = `${clientSlug}-Performance-Report-${dateSlug}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(pdfBuffer.length),
            'Cache-Control': 'no-store',
        });
        res.send(pdfBuffer);
    }
    catch (e) {
        console.error('PDF generation error:', e);
        res.status(500).json({ error: 'PDF generation failed', message: e.message });
    }
});
router.put('/:id/rating', async (req, res) => {
    const { rating, section, note } = req.body;
    if (!rating || !['up', 'down'].includes(rating)) {
        return res.status(400).json({ error: 'Invalid rating' });
    }
    if (rating === 'down' && !section) {
        return res.status(400).json({ error: 'Section required for negative rating' });
    }
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    const updated = await db_1.default.report.update({
        where: { id: req.params.id },
        data: {
            narrativeRating: rating,
            narrativeRatingSection: section || null,
            narrativeRatingNote: note || null,
        },
    });
    res.json(updated);
});
router.put('/:id/share', async (req, res) => {
    const { enabled } = req.body;
    // Sharing is Agency Pro only
    if (enabled) {
        const agency = await db_1.default.agency.findUnique({ where: { id: req.agencyId }, select: { subscriptionTier: true } });
        if (agency?.subscriptionTier !== 'AGENCY_PRO') {
            return res.status(403).json({
                error: 'FEATURE_LOCKED',
                message: 'Shareable client portals require the Agency Pro plan.',
                upgradeUrl: '/settings/billing',
            });
        }
    }
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    let shareToken = report.shareToken;
    if (enabled && !shareToken) {
        shareToken = crypto_1.default.randomBytes(32).toString('base64url');
    }
    const updated = await db_1.default.report.update({
        where: { id: req.params.id },
        data: { shareEnabled: enabled, shareToken: enabled ? shareToken : report.shareToken },
    });
    res.json(updated);
});
router.post('/:id/send', async (req, res) => {
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
        include: { client: true },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'ready') {
        return res.status(400).json({ error: 'Report is not ready', status: report.status, message: 'The report must finish generating before it can be sent.' });
    }
    const emailTo = req.body.email || report.client.contactEmail;
    if (!emailTo) {
        return res.status(400).json({ error: 'NO_EMAIL', message: 'No recipient email address. Provide an email or add one to the client profile.' });
    }
    const delivery = await db_1.default.reportDelivery.create({
        data: {
            reportId: report.id,
            agencyId: req.agencyId,
            clientId: report.clientId,
            status: 'sending',
        },
    });
    sendReportEmail(delivery.id, report, emailTo).catch(console.error);
    res.status(201).json(delivery);
});
async function sendReportEmail(deliveryId, report, emailTo) {
    try {
        if (!process.env.RESEND_API_KEY) {
            await new Promise(r => setTimeout(r, 1000));
            await db_1.default.reportDelivery.update({
                where: { id: deliveryId },
                data: { status: 'sent', sentAt: new Date() },
            });
            return;
        }
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const agency = await db_1.default.agency.findUnique({ where: { id: report.agencyId } });
        const dateRange = `${new Date(report.dateRangeStart).toLocaleDateString()} - ${new Date(report.dateRangeEnd).toLocaleDateString()}`;
        const clientName = report.client?.name || 'Client';
        const contactName = report.client?.contactName || clientName;
        const agencyName = agency?.name || 'ReportCraft AI';
        const bodyTemplate = report.client?.emailBodyTemplate;
        const htmlBody = bodyTemplate
            ? bodyTemplate.replace(/\{client\}/g, clientName).replace(/\{contact\}/g, contactName).replace(/\{date\}/g, dateRange).replace(/\n/g, '<br>')
            : `<p>Hi ${contactName},</p><p>Please find your performance report for ${dateRange} attached.</p><p>Best regards,<br>${agencyName}</p>`;
        const filename = `${clientName.replace(/\s+/g, '-')}-Report-${new Date(report.dateRangeStart).toISOString().slice(0, 10)}.pdf`;
        let attachments = [];
        try {
            const { generatePDF } = await Promise.resolve().then(() => __importStar(require('../services/pdf.service')));
            const pdfBuffer = await generatePDF(report, agency, report.client);
            attachments = [{ filename, content: pdfBuffer }];
        }
        catch (pdfErr) {
            console.error('PDF generation for email failed, sending without attachment:', pdfErr);
        }
        const { data, error } = await resend.emails.send({
            from: `${agencyName} <reports@reportcraft.ai>`,
            to: [emailTo],
            subject: report.client?.emailSubjectTemplate?.replace('{client}', clientName).replace('{date}', dateRange)
                || `${clientName} — Performance Report — ${dateRange}`,
            html: htmlBody,
            ...(attachments.length > 0 && { attachments }),
        });
        await db_1.default.reportDelivery.update({
            where: { id: deliveryId },
            data: {
                status: error ? 'failed' : 'sent',
                sentAt: error ? null : new Date(),
                resendEmailId: data?.id,
                failureReason: error ? String(error) : null,
            },
        });
    }
    catch (e) {
        await db_1.default.reportDelivery.update({
            where: { id: deliveryId },
            data: { status: 'failed', failureReason: e.message },
        });
    }
}
exports.default = router;
//# sourceMappingURL=reports.js.map