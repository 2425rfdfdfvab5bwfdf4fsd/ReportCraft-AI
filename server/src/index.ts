import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startKeepAliveJob, startMonthlyResetJob, startStaleReportCleanup } from './jobs/keepalive';

const PORT = parseInt(process.env.PORT || '8000', 10);

async function main() {
  // Clean up stale reports from any previous crash
  startStaleReportCleanup();

  // Start background jobs
  startKeepAliveJob();
  startMonthlyResetJob();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReportCraft AI server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch(console.error);
