import type { ReportInput, AgencyInput, ClientInput } from '../types';
/**
 * Renders a full A4 PDF report and returns it as a buffer.
 *
 * @param report  Minimal report fields (dates, rawData, narrative, tone).
 * @param agency  Agency branding and subscription tier.
 * @param client  Client display name.
 */
export declare function generatePDF(report: ReportInput, agency: AgencyInput, client: ClientInput): Promise<Buffer>;
//# sourceMappingURL=pdf.service.d.ts.map