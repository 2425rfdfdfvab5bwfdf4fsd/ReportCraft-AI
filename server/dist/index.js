"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const keepalive_1 = require("./jobs/keepalive");
const anomaly_detection_job_1 = require("./jobs/anomaly-detection.job");
const report_scheduler_job_1 = require("./jobs/report-scheduler.job");
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});
const PORT = parseInt(process.env.PORT || '8000', 10);
async function main() {
    (0, keepalive_1.startStaleReportCleanup)();
    (0, keepalive_1.startKeepAliveJob)();
    (0, keepalive_1.startMonthlyResetJob)();
    (0, anomaly_detection_job_1.startAnomalyDetectionJob)();
    (0, report_scheduler_job_1.startReportSchedulerJob)();
    app_1.default.listen(PORT, '0.0.0.0', () => {
        console.log(`ReportCraft AI server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}
main().catch(console.error);
//# sourceMappingURL=index.js.map