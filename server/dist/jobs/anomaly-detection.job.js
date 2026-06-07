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
exports.startAnomalyDetectionJob = startAnomalyDetectionJob;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../lib/db"));
const config_1 = require("../config");
// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctChange(current, prev) {
    if (!prev || prev === 0)
        return 0;
    return (current - prev) / prev;
}
async function sendAnomalyAlert(agencyEmail, agencyName, clientName, reportId, anomalies) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[anomaly] Would email ${agencyEmail} about ${anomalies.length} anomaly/ies for ${clientName}`);
        return;
    }
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const anomalyRows = anomalies.map(a => {
            const dir = a.pctChange > 0 ? '↑' : '↓';
            const pct = Math.abs(a.pctChange * 100).toFixed(1);
            return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.metric}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.previous.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.current.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:${a.pctChange > 0 ? '#16A34A' : '#DC2626'}">${dir} ${pct}%</td>
      </tr>`;
        }).join('');
        const reportUrl = `${process.env.FRONTEND_URL || 'https://app.reportcraft.ai'}/reports/${reportId}`;
        await resend.emails.send({
            from: 'ReportCraft AI <alerts@reportcraft.ai>',
            to: [agencyEmail],
            subject: `⚠️ Metric alert for ${clientName} — significant changes detected`,
            html: `
        <h2 style="font-family:sans-serif">Anomaly Alert: ${clientName}</h2>
        <p style="font-family:sans-serif;color:#555">
          The following metrics changed by more than ${config_1.config.anomaly.changeThreshold * 100}%
          compared to the previous 7-day period:
        </p>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px 12px;text-align:left">Metric</th>
              <th style="padding:8px 12px;text-align:left">Previous</th>
              <th style="padding:8px 12px;text-align:left">Current</th>
              <th style="padding:8px 12px;text-align:left">Change</th>
            </tr>
          </thead>
          <tbody>${anomalyRows}</tbody>
        </table>
        <p style="font-family:sans-serif;margin-top:20px">
          <a href="${reportUrl}" style="background:#6366F1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
            View Report
          </a>
        </p>
        <p style="font-family:sans-serif;font-size:12px;color:#999;margin-top:20px">
          You're receiving this because anomaly alerts are enabled for ${agencyName}.
          Manage alerts in Settings.
        </p>
      `,
        });
    }
    catch (e) {
        console.error('[anomaly] Email send failed:', e);
    }
}
// ─── Detection logic ──────────────────────────────────────────────────────────
async function runAnomalyDetection() {
    console.log('[anomaly] Running weekly anomaly detection...');
    const now = new Date();
    // Build the current 7-day window (ending last Sunday 23:59:59)
    const windowEnd = new Date(now);
    windowEnd.setUTCDate(windowEnd.getUTCDate() - windowEnd.getUTCDay());
    windowEnd.setUTCHours(23, 59, 59, 999);
    const windowStart = new Date(windowEnd);
    windowStart.setUTCDate(windowStart.getUTCDate() - 7);
    // Build the preceding 7-day window for comparison
    const prevEnd = new Date(windowStart);
    prevEnd.setUTCMilliseconds(prevEnd.getUTCMilliseconds() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(prevStart.getUTCDate() - 7);
    const agencies = await db_1.default.agency.findMany({
        where: {
            anomalyAlertsEnabled: true,
            subscriptionStatus: { in: ['active', 'trial'] },
        },
    });
    for (const agency of agencies) {
        const clients = await db_1.default.client.findMany({
            where: { agencyId: agency.id, archivedAt: null, anomalyAlertsEnabled: true },
        });
        for (const client of clients) {
            const [currentReport, prevReport] = await Promise.all([
                db_1.default.report.findFirst({
                    where: {
                        clientId: client.id, agencyId: agency.id, status: 'ready',
                        dateRangeStart: { gte: windowStart }, dateRangeEnd: { lte: windowEnd },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                db_1.default.report.findFirst({
                    where: {
                        clientId: client.id, agencyId: agency.id, status: 'ready',
                        dateRangeStart: { gte: prevStart }, dateRangeEnd: { lte: prevEnd },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);
            if (!currentReport?.rawData || !prevReport?.rawData)
                continue;
            const curr = currentReport.rawData;
            const prev = prevReport.rawData;
            const anomalies = [];
            const check = (name, current, previous) => {
                if (!current || !previous)
                    return;
                const change = pctChange(current, previous);
                if (Math.abs(change) >= config_1.config.anomaly.changeThreshold) {
                    anomalies.push({ metric: name, current, previous, pctChange: change });
                }
            };
            if (curr.ga4 && prev.ga4) {
                check('GA4 Sessions', curr.ga4.sessions, prev.ga4.sessions);
                check('GA4 Bounce Rate', curr.ga4.bounceRate, prev.ga4.bounceRate);
                check('GA4 Conversion Rate', curr.ga4.conversionRate, prev.ga4.conversionRate);
            }
            if (curr.googleAds && prev.googleAds) {
                check('Google Ads Spend', curr.googleAds.spend, prev.googleAds.spend);
                check('Google Ads ROAS', curr.googleAds.roas, prev.googleAds.roas);
                check('Google Ads CTR', curr.googleAds.ctr, prev.googleAds.ctr);
            }
            if (curr.meta && prev.meta) {
                check('Meta Ads Spend', curr.meta.spend, prev.meta.spend);
                check('Meta Ads ROAS', curr.meta.roas, prev.meta.roas);
                check('Meta Ads CPM', curr.meta.cpm, prev.meta.cpm);
            }
            if (anomalies.length > 0) {
                const agencyEmail = `${agency.name?.toLowerCase().replace(/\s+/g, '') || 'agency'}@reportcraft.ai`;
                await sendAnomalyAlert(agencyEmail, agency.name || 'Your Agency', client.name, currentReport.id, anomalies);
            }
        }
    }
    console.log('[anomaly] Weekly anomaly detection complete');
}
// ─── Scheduler ────────────────────────────────────────────────────────────────
/** Schedules the anomaly-detection scan to run every Monday at 06:00 UTC. */
function startAnomalyDetectionJob() {
    node_cron_1.default.schedule('0 6 * * 1', () => runAnomalyDetection().catch(e => console.error('[anomaly] Job failed:', e)), { timezone: 'UTC' });
    console.log('[anomaly] Anomaly detection job scheduled (Mon 06:00 UTC)');
}
//# sourceMappingURL=anomaly-detection.job.js.map