import { Router, Request, Response } from 'express';
import prisma from '../lib/db';
import { generatePDF } from '../services/pdf.service';

const router = Router();

router.post('/:id/export-pdf', async (req: Request, res: Response) => {
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
    include: { client: true },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const agency = await prisma.agency.findUnique({ where: { id: req.agencyId } });

  try {
    const pdfBuffer = await generatePDF(report, agency, report.client);
    const filename = `${report.client.name.replace(/\s+/g, '-')}-Report-${new Date(report.dateRangeStart).toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (e: any) {
    console.error('PDF generation error:', e);
    res.status(500).json({ error: 'PDF generation failed. Please try again.' });
  }
});

export default router;
