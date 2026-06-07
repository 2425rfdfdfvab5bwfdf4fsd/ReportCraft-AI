"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const pdf_service_1 = require("../services/pdf.service");
const router = (0, express_1.Router)();
router.post('/:id/export-pdf', async (req, res) => {
    const report = await db_1.default.report.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
        include: { client: true },
    });
    if (!report)
        return res.status(404).json({ error: 'Report not found' });
    const agency = await db_1.default.agency.findUnique({ where: { id: req.agencyId } });
    try {
        const pdfBuffer = await (0, pdf_service_1.generatePDF)(report, agency, report.client);
        const filename = `${report.client.name.replace(/\s+/g, '-')}-Report-${new Date(report.dateRangeStart).toISOString().slice(0, 10)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    }
    catch (e) {
        console.error('PDF generation error:', e);
        res.status(500).json({ error: 'PDF generation failed. Please try again.' });
    }
});
exports.default = router;
//# sourceMappingURL=pdf.js.map