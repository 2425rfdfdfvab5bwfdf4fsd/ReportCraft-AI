import cron from 'node-cron';
import prisma from '../lib/db';
import { config } from '../config';
import type { RawData } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricAnomaly {
  metric:    string;
  current:   number;
  previous:  number;
  pctChange: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pctChange(current: number, prev: number): number {
  if (!prev || prev === 0) return 0;
  return (current - prev) / prev;
}

async function sendAnomalyAlert(
  agencyEmail: string,
  agencyName:  string,
  clientName:  string,
  reportId:    string,
  anomalies:   MetricAnomaly[],
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[anomaly] Would email ${agencyEmail} about ${anomalies.length} anomaly/ies for ${clientName}`);
    return;
  }

  try {
    const { Resend } = await import('resend');
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
      from:    'ReportCraft AI <alerts@reportcraft.ai>',
      to:      [agencyEmail],
      subject: `⚠️ Metric alert for ${clientName} — significant changes detected`,
      html: `
        <h2 style="font-family:sans-serif">Anomaly Alert: ${clientName}</h2>
        <p style="font-family:sans-serif;color:#555">
          The following metrics changed by more than ${config.anomaly.changeThreshold * 100}%
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
  } catch (e) {
    console.error('[anomaly] Email send failed:', e);
  }
}

// ─── Detection logic ──────────────────────────────────────────────────────────

async function runAnomalyDetection(): Promise<void> {
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

  const agencies = await prisma.agency.findMany({
    where: {
      anomalyAlertsEnabled: true,
      subscriptionStatus: { in: ['active', 'trial'] },
    },
  });

  for (const agency of agencies) {
    const clients = await prisma.client.findMany({
      where: { agencyId: agency.id, archivedAt: null, anomalyAlertsEnabled: true },
    });

    for (const client of clients) {
      const [currentReport, prevReport] = await Promise.all([
        prisma.report.findFirst({
          where: {
            clientId: client.id, agencyId: agency.id, status: 'ready',
            dateRangeStart: { gte: windowStart }, dateRangeEnd: { lte: windowEnd },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.report.findFirst({
          where: {
            clientId: client.id, agencyId: agency.id, status: 'ready',
            dateRangeStart: { gte: prevStart }, dateRangeEnd: { lte: prevEnd },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (!currentReport?.rawData || !prevReport?.rawData) continue;

      const curr = currentReport.rawData as unknown as RawData;
      const prev = prevReport.rawData  as unknown as RawData;
      const anomalies: MetricAnomaly[] = [];

      const check = (name: string, current?: number, previous?: number) => {
        if (!current || !previous) return;
        const change = pctChange(current, previous);
        if (Math.abs(change) >= config.anomaly.changeThreshold) {
          anomalies.push({ metric: name, current, previous, pctChange: change });
        }
      };

      if (curr.ga4 && prev.ga4) {
        check('GA4 Sessions',         curr.ga4.sessions,       prev.ga4.sessions);
        check('GA4 Bounce Rate',      curr.ga4.bounceRate,     prev.ga4.bounceRate);
        check('GA4 Conversion Rate',  curr.ga4.conversionRate, prev.ga4.conversionRate);
      }
      if (curr.googleAds && prev.googleAds) {
        check('Google Ads Spend', curr.googleAds.spend, prev.googleAds.spend);
        check('Google Ads ROAS',  curr.googleAds.roas,  prev.googleAds.roas);
        check('Google Ads CTR',   curr.googleAds.ctr,   prev.googleAds.ctr);
      }
      if (curr.meta && prev.meta) {
        check('Meta Ads Spend', curr.meta.spend, prev.meta.spend);
        check('Meta Ads ROAS',  curr.meta.roas,  prev.meta.roas);
        check('Meta Ads CPM',   curr.meta.cpm,   prev.meta.cpm);
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
export function startAnomalyDetectionJob(): void {
  cron.schedule(
    '0 6 * * 1',
    () => runAnomalyDetection().catch(e => console.error('[anomaly] Job failed:', e)),
    { timezone: 'UTC' },
  );
  console.log('[anomaly] Anomaly detection job scheduled (Mon 06:00 UTC)');
}
