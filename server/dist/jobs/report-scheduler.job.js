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
exports.startReportSchedulerJob = startReportSchedulerJob;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../lib/db"));
async function processScheduledReports() {
    const now = new Date();
    const currentMinute = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const currentDow = now.getUTCDay();
    const clients = await db_1.default.client.findMany({
        where: {
            archivedAt: null,
            reportSchedule: { not: null },
        },
        include: {
            agency: true,
        },
    });
    for (const client of clients) {
        if (!client.reportSchedule)
            continue;
        try {
            const shouldRun = checkCronMatch(client.reportSchedule, now);
            if (!shouldRun)
                continue;
            const agency = client.agency;
            if (['cancelled', 'past_due'].includes(agency.subscriptionStatus)) {
                console.log(`[scheduler] Skipping ${client.name} — agency ${agency.id} status: ${agency.subscriptionStatus}`);
                continue;
            }
            const connectors = await db_1.default.clientConnector.findMany({
                where: { clientId: client.id },
                include: { oauthToken: true },
            });
            const expiredConnectors = connectors.filter(cc => cc.oauthToken.status !== 'active');
            if (expiredConnectors.length > 0 && connectors.length > 0) {
                console.warn(`[scheduler] ${client.name} has expired connectors, skipping automated send`);
                await notifyExpiredConnectors(agency, client, expiredConnectors);
                continue;
            }
            const endDate = new Date();
            endDate.setUTCHours(0, 0, 0, 0);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 30);
            const existing = await db_1.default.report.findFirst({
                where: {
                    clientId: client.id,
                    dateRangeStart: startDate,
                    dateRangeEnd: endDate,
                    status: 'generating',
                },
            });
            if (existing)
                continue;
            const report = await db_1.default.report.create({
                data: {
                    agencyId: agency.id,
                    clientId: client.id,
                    dateRangeStart: startDate,
                    dateRangeEnd: endDate,
                    narrativeTone: agency.narrativeTone,
                    status: 'generating',
                },
            });
            console.log(`[scheduler] Created report ${report.id} for client ${client.name}`);
            generateAndSendReport(report.id, client, agency).catch(e => console.error(`[scheduler] Failed for ${client.name}:`, e));
        }
        catch (e) {
            console.error(`[scheduler] Error processing client ${client.id}:`, e);
        }
    }
}
function checkCronMatch(cronExpr, date) {
    try {
        const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpr.split(' ');
        const d = date;
        const matchField = (field, value) => {
            if (field === '*')
                return true;
            return parseInt(field) === value;
        };
        return (matchField(minute, d.getUTCMinutes()) &&
            matchField(hour, d.getUTCHours()) &&
            matchField(dayOfMonth, d.getUTCDate()) &&
            matchField(month, d.getUTCMonth() + 1) &&
            matchField(dayOfWeek, d.getUTCDay()));
    }
    catch {
        return false;
    }
}
async function notifyExpiredConnectors(agency, client, expiredConnectors) {
    if (!process.env.RESEND_API_KEY)
        return;
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const platforms = expiredConnectors.map(cc => cc.oauthToken.platform.replace(/_/g, ' ')).join(', ');
        await resend.emails.send({
            from: 'ReportCraft AI <noreply@reportcraft.ai>',
            to: [agency.ownerEmail || `${agency.slug}@reportcraft.ai`],
            subject: `Action required: ${client.name} automated report not sent`,
            html: `
        <p>Hi,</p>
        <p>The automated report for <strong>${client.name}</strong> was not sent because the following connection(s) have expired:</p>
        <p><strong>${platforms}</strong></p>
        <p>Please <a href="${process.env.FRONTEND_URL || 'https://app.reportcraft.ai'}/connectors">reconnect these accounts</a> and send the report manually.</p>
        <p>— ReportCraft AI</p>
      `,
        });
    }
    catch (e) {
        console.error('[scheduler] Failed to send expired-connector notification:', e);
    }
}
async function generateAndSendReport(reportId, client, agency) {
    const { generateNarrative, generateMockNarrative } = await Promise.resolve().then(() => __importStar(require('../services/ai.service')));
    const startTime = Date.now();
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
        };
    }
    try {
        const rawData = generateMockData();
        let narrativeResult;
        let aiModel = 'mock';
        const hasAI = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (hasAI) {
            try {
                const result = await generateNarrative(rawData, agency.narrativeTone, client.name, client.goals);
                narrativeResult = result.result;
                aiModel = result.model;
            }
            catch {
                narrativeResult = generateMockNarrative(client.name);
                aiModel = 'mock_fallback';
            }
        }
        else {
            narrativeResult = generateMockNarrative(client.name);
        }
        const report = await db_1.default.report.update({
            where: { id: reportId },
            data: {
                status: 'ready',
                rawData: rawData,
                narrative: narrativeResult,
                aiModel,
                generationDurationMs: Date.now() - startTime,
            },
            include: { client: true },
        });
        await db_1.default.client.update({ where: { id: client.id }, data: { lastReportAt: new Date() } });
        if (report.client.contactEmail) {
            await sendScheduledReport(report, agency, report.client);
        }
    }
    catch (e) {
        console.error('[scheduler] Generation failed:', e);
        await db_1.default.report.update({ where: { id: reportId }, data: { status: 'error' } });
    }
}
async function sendScheduledReport(report, agency, client) {
    if (!process.env.RESEND_API_KEY)
        return;
    const delivery = await db_1.default.reportDelivery.create({
        data: {
            reportId: report.id,
            agencyId: agency.id,
            clientId: client.id,
            status: 'sending',
        },
    });
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const dateRange = `${new Date(report.dateRangeStart).toLocaleDateString()} - ${new Date(report.dateRangeEnd).toLocaleDateString()}`;
        const { data, error } = await resend.emails.send({
            from: `${agency.name || 'ReportCraft AI'} <reports@reportcraft.ai>`,
            to: [client.contactEmail],
            subject: client.emailSubjectTemplate?.replace('{client}', client.name).replace('{date}', dateRange)
                || `${client.name} — Performance Report — ${dateRange}`,
            html: `<p>Hi ${client.contactName},</p><p>Please find your performance report for ${dateRange} attached.</p><p>Best regards,<br>${agency.name}</p>`,
        });
        await db_1.default.reportDelivery.update({
            where: { id: delivery.id },
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
            where: { id: delivery.id },
            data: { status: 'failed', failureReason: e.message },
        });
    }
}
function startReportSchedulerJob() {
    node_cron_1.default.schedule('* * * * *', () => {
        processScheduledReports().catch(e => console.error('[scheduler] processScheduledReports error:', e));
    }, { timezone: 'UTC' });
    console.log('[scheduler] Report scheduler job started (runs every minute)');
}
//# sourceMappingURL=report-scheduler.job.js.map