"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startKeepAliveJob = startKeepAliveJob;
exports.startMonthlyResetJob = startMonthlyResetJob;
exports.startStaleReportCleanup = startStaleReportCleanup;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../lib/db"));
function startKeepAliveJob() {
    // Ping DB every 4 minutes to prevent Neon cold-start
    node_cron_1.default.schedule('*/4 * * * *', async () => {
        try {
            await db_1.default.$queryRaw `SELECT 1`;
        }
        catch (e) {
            console.error('DB keep-alive failed:', e);
        }
    });
}
function startMonthlyResetJob() {
    // Reset AI report usage on 1st of each month at midnight UTC
    node_cron_1.default.schedule('0 0 1 * *', async () => {
        try {
            await db_1.default.agency.updateMany({ data: { aiReportsUsedThisMonth: 0 } });
            console.log('Monthly AI report usage reset complete');
        }
        catch (e) {
            console.error('Monthly reset failed:', e);
        }
    });
}
function startStaleReportCleanup() {
    async function cleanup() {
        const cutoff = new Date(Date.now() - 35 * 1000);
        const updated = await db_1.default.report.updateMany({
            where: { status: 'generating', updatedAt: { lt: cutoff } },
            data: { status: 'error' },
        });
        if (updated.count > 0) {
            console.log(`Cleaned up ${updated.count} stale generating report(s)`);
        }
    }
    cleanup().catch((e) => console.warn('Stale report cleanup skipped:', e.message));
}
//# sourceMappingURL=keepalive.js.map