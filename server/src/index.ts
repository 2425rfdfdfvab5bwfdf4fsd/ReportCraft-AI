import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startKeepAliveJob, startMonthlyResetJob, startStaleReportCleanup } from './jobs/keepalive';
import { startAnomalyDetectionJob } from './jobs/anomaly-detection.job';
import { startReportSchedulerJob } from './jobs/report-scheduler.job';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const PORT = parseInt(process.env.PORT || '8000', 10);

async function main() {
  startStaleReportCleanup();

  startKeepAliveJob();
  startMonthlyResetJob();
  startAnomalyDetectionJob();
  startReportSchedulerJob();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReportCraft AI server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch(console.error);
