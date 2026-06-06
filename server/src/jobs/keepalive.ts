import cron from 'node-cron';
import prisma from '../lib/db';

export function startKeepAliveJob() {
  // Ping DB every 4 minutes to prevent Neon cold-start
  cron.schedule('*/4 * * * *', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      console.error('DB keep-alive failed:', e);
    }
  });
}

export function startMonthlyResetJob() {
  // Reset AI report usage on 1st of each month at midnight UTC
  cron.schedule('0 0 1 * *', async () => {
    try {
      await prisma.agency.updateMany({ data: { aiReportsUsedThisMonth: 0 } });
      console.log('Monthly AI report usage reset complete');
    } catch (e) {
      console.error('Monthly reset failed:', e);
    }
  });
}

export function startStaleReportCleanup() {
  async function cleanup() {
    const cutoff = new Date(Date.now() - 35 * 1000);
    const updated = await prisma.report.updateMany({
      where: { status: 'generating', updatedAt: { lt: cutoff } },
      data: { status: 'error' },
    });
    if (updated.count > 0) {
      console.log(`Cleaned up ${updated.count} stale generating report(s)`);
    }
  }
  cleanup().catch((e) => console.warn('Stale report cleanup skipped:', e.message));
}
