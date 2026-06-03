import cron from 'node-cron';
import prisma from '../lib/db';

const THRESHOLD = 0.20;

function pctChange(current: number, prev: number): number {
  if (!prev || prev === 0) return 0;
  return (current - prev) / prev;
}

interface MetricAnomaly {
  metric: string;
  current: number;
  previous: number;
  pctChange: number;
}

async function sendAnomalyAlert(
  agencyEmail: string,
  agencyName: string,
  clientName: string,
  reportId: string,
  anomalies: MetricAnomaly[],
) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[anomaly] Would email ${agencyEmail} about ${anomalies.length} anomalies for ${clientName}`);
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
      from: `ReportCraft AI <alerts@reportcraft.ai>`,
      to: [agencyEmail],
      subject: `⚠️ Metric alert for ${clientName} — significant changes detected`,
      html: `
        <h2 style="font-family:sans-serif">Anomaly Alert: ${clientName}</h2>
        <p style="font-family:sans-serif;color:#555">
          The following metrics changed by more than 20% compared to the previous 7-day period:
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
          <a href="${reportUrl}" style="background:#6366F1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">View Report</a>
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

async function runAnomalyDetection() {
  console.log('[anomaly] Running weekly anomaly detection...');

  const now = new Date();
  const sunday2359 = new Date(now);
  sunday2359.setUTCDate(sunday2359.getUTCDate() - sunday2359.getUTCDay());
  sunday2359.setUTCHours(23, 59, 59, 999);

  const currentStart = new Date(sunday2359);
  currentStart.setUTCDate(currentStart.getUTCDate() - 7);
  const currentEnd = sunday2359;

  const prevEnd = new Date(currentStart);
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
      where: {
        agencyId: agency.id,
        archivedAt: null,
        anomalyAlertsEnabled: true,
      },
    });

    for (const client of clients) {
      const currentReport = await prisma.report.findFirst({
        where: {
          clientId: client.id,
          agencyId: agency.id,
          status: 'ready',
          dateRangeStart: { gte: currentStart },
          dateRangeEnd: { lte: currentEnd },
        },
        orderBy: { createdAt: 'desc' },
      });

      const prevReport = await prisma.report.findFirst({
        where: {
          clientId: client.id,
          agencyId: agency.id,
          status: 'ready',
          dateRangeStart: { gte: prevStart },
          dateRangeEnd: { lte: prevEnd },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!currentReport?.rawData || !prevReport?.rawData) continue;

      const curr = currentReport.rawData as any;
      const prev = prevReport.rawData as any;
      const anomalies: MetricAnomaly[] = [];

      const checkMetric = (name: string, current: number, previous: number) => {
        if (!current || !previous) return;
        const change = pctChange(current, previous);
        if (Math.abs(change) >= THRESHOLD) {
          anomalies.push({ metric: name, current, previous, pctChange: change });
        }
      };

      if (curr.ga4 && prev.ga4) {
        checkMetric('GA4 Sessions', curr.ga4.sessions, prev.ga4.sessions);
        checkMetric('GA4 Bounce Rate', curr.ga4.bounceRate, prev.ga4.bounceRate);
        checkMetric('GA4 Conversion Rate', curr.ga4.conversionRate, prev.ga4.conversionRate);
      }
      if (curr.googleAds && prev.googleAds) {
        checkMetric('Google Ads Spend', curr.googleAds.spend, prev.googleAds.spend);
        checkMetric('Google Ads ROAS', curr.googleAds.roas, prev.googleAds.roas);
        checkMetric('Google Ads CTR', curr.googleAds.ctr, prev.googleAds.ctr);
      }
      if (curr.meta && prev.meta) {
        checkMetric('Meta Ads Spend', curr.meta.spend, prev.meta.spend);
        checkMetric('Meta Ads ROAS', curr.meta.roas, prev.meta.roas);
        checkMetric('Meta Ads CPM', curr.meta.cpm, prev.meta.cpm);
      }

      if (anomalies.length > 0) {
        const agencyEmail = `${agency.name?.toLowerCase().replace(/\s+/g, '') || 'agency'}@reportcraft.ai`;
        await sendAnomalyAlert(
          agencyEmail,
          agency.name || 'Your Agency',
          client.name,
          currentReport.id,
          anomalies,
        );
      }
    }
  }

  console.log('[anomaly] Weekly anomaly detection complete');
}

export function startAnomalyDetectionJob() {
  cron.schedule('0 6 * * 1', () => {
    runAnomalyDetection().catch(e => console.error('[anomaly] Job failed:', e));
  }, { timezone: 'UTC' });
  console.log('[anomaly] Anomaly detection job scheduled (Mon 06:00 UTC)');
}
