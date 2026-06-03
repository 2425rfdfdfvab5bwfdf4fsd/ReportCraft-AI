import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/db';
import { generateNarrative, generateMockNarrative, NarrativeData } from '../services/ai.service';

const router = Router();

const createReportSchema = z.object({
  clientId: z.string(),
  dateRangeStart: z.string(),
  dateRangeEnd: z.string(),
  narrativeTone: z.enum(['professional', 'conversational', 'executive']).optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const clientId = req.query.clientId as string;

  const where: any = { agencyId: req.agencyId };
  if (clientId) where.clientId = clientId;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.report.count({ where }),
  ]);
  res.json({ reports, total });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createReportSchema.parse(req.body);

    const client = await prisma.client.findFirst({
      where: { id: data.clientId, agencyId: req.agencyId },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Check for existing generating report
    const existing = await prisma.report.findFirst({
      where: {
        clientId: data.clientId,
        dateRangeStart: new Date(data.dateRangeStart),
        dateRangeEnd: new Date(data.dateRangeEnd),
        status: 'generating',
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'A report is already being generated for this client and date range.' });
    }

    const agency = await prisma.agency.findUnique({ where: { id: req.agencyId } });

    const report = await prisma.report.create({
      data: {
        agencyId: req.agencyId,
        clientId: data.clientId,
        dateRangeStart: new Date(data.dateRangeStart),
        dateRangeEnd: new Date(data.dateRangeEnd),
        narrativeTone: data.narrativeTone || agency?.narrativeTone || 'professional',
        status: 'generating',
      },
    });

    // Run generation async
    generateReportAsync(report.id, client, data.narrativeTone || agency?.narrativeTone || 'professional');

    res.status(201).json({ id: report.id, status: 'generating' });
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    throw e;
  }
});

async function generateReportAsync(reportId: string, client: any, tone: string) {
  const startTime = Date.now();
  try {
    const rawData: NarrativeData = generateMockData();

    let narrativeResult;
    let aiModel = 'mock';

    if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await generateNarrative(rawData, tone, client.name, client.goals);
        narrativeResult = result.result;
        aiModel = result.model;
      } catch (e) {
        narrativeResult = generateMockNarrative(client.name);
        aiModel = 'mock_fallback';
      }
    } else {
      narrativeResult = generateMockNarrative(client.name);
    }

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'ready',
        rawData: rawData as any,
        narrative: narrativeResult as any,
        aiModel,
        generationDurationMs: Date.now() - startTime,
      },
    });

    // Update client lastReportAt
    await prisma.client.update({
      where: { id: client.id },
      data: { lastReportAt: new Date() },
    });
  } catch (e) {
    console.error('Report generation failed:', e);
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'error' },
    });
  }
}

function generateMockData(): NarrativeData {
  const rand = (base: number, variance: number) => base + (Math.random() - 0.5) * variance;
  return {
    ga4: {
      sessions: Math.round(rand(12400, 2000)),
      sessionsPrev: Math.round(rand(11000, 2000)),
      bounceRate: rand(0.42, 0.1),
      bounceRatePrev: rand(0.45, 0.1),
      users: Math.round(rand(9800, 1500)),
      usersPrev: Math.round(rand(8900, 1500)),
      pageviews: Math.round(rand(34000, 5000)),
      pageviewsPrev: Math.round(rand(31000, 5000)),
      avgSessionDuration: rand(145, 30),
      avgSessionDurationPrev: rand(132, 30),
      conversionRate: rand(0.038, 0.01),
      conversionRatePrev: rand(0.034, 0.01),
    },
    googleAds: {
      impressions: Math.round(rand(280000, 50000)),
      impressionsPrev: Math.round(rand(260000, 50000)),
      clicks: Math.round(rand(7560, 1000)),
      clicksPrev: Math.round(rand(6800, 1000)),
      ctr: rand(0.027, 0.005),
      ctrPrev: rand(0.023, 0.005),
      spend: rand(4200, 500),
      spendPrev: rand(4050, 500),
      cpc: rand(0.56, 0.1),
      cpcPrev: rand(0.61, 0.1),
      conversions: Math.round(rand(287, 50)),
      conversionsPrev: Math.round(rand(231, 50)),
      conversionRate: rand(0.038, 0.01),
      conversionRatePrev: rand(0.034, 0.01),
      roas: rand(4.2, 0.8),
      roasPrev: rand(3.8, 0.8),
    },
    meta: {
      impressions: Math.round(rand(890000, 100000)),
      impressionsPrev: Math.round(rand(920000, 100000)),
      reach: Math.round(rand(234000, 30000)),
      reachPrev: Math.round(rand(241000, 30000)),
      clicks: Math.round(rand(4230, 500)),
      clicksPrev: Math.round(rand(4890, 500)),
      ctr: rand(0.0047, 0.001),
      ctrPrev: rand(0.0053, 0.001),
      spend: rand(3800, 400),
      spendPrev: rand(3650, 400),
      cpm: rand(4.27, 0.5),
      cpmPrev: rand(3.97, 0.5),
      roas: rand(2.8, 0.5),
      roasPrev: rand(3.1, 0.5),
    },
  };
}

router.get('/:id', async (req: Request, res: Response) => {
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
    include: { client: { select: { id: true, name: true, contactEmail: true } } },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

router.post('/:id/regenerate-narrative', async (req: Request, res: Response) => {
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
    include: { client: true },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const tone = req.body.tone || report.narrativeTone;
  await prisma.report.update({ where: { id: report.id }, data: { status: 'generating' } });

  generateReportAsync(report.id, report.client, tone);

  res.json({ id: report.id, status: 'generating' });
});

router.put('/:id/rating', async (req: Request, res: Response) => {
  const { rating, section, note } = req.body;
  if (!rating || !['up', 'down'].includes(rating)) {
    return res.status(400).json({ error: 'Invalid rating' });
  }
  if (rating === 'down' && !section) {
    return res.status(400).json({ error: 'Section required for negative rating' });
  }

  const report = await prisma.report.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: {
      narrativeRating: rating,
      narrativeRatingSection: section || null,
      narrativeRatingNote: note || null,
    },
  });
  res.json(updated);
});

router.put('/:id/share', async (req: Request, res: Response) => {
  const { enabled } = req.body;
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  let shareToken = report.shareToken;
  if (enabled && !shareToken) {
    shareToken = crypto.randomBytes(32).toString('base64url');
  }

  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: { shareEnabled: enabled, shareToken: enabled ? shareToken : report.shareToken },
  });
  res.json(updated);
});

router.post('/:id/send', async (req: Request, res: Response) => {
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
    include: { client: true },
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const emailTo = req.body.email || report.client.contactEmail;

  const delivery = await prisma.reportDelivery.create({
    data: {
      reportId: report.id,
      agencyId: req.agencyId,
      clientId: report.clientId,
      status: 'sending',
    },
  });

  sendReportEmail(delivery.id, report, emailTo).catch(console.error);

  res.status(201).json(delivery);
});

async function sendReportEmail(deliveryId: string, report: any, emailTo: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      await new Promise(r => setTimeout(r, 1000));
      await prisma.reportDelivery.update({
        where: { id: deliveryId },
        data: { status: 'sent', sentAt: new Date() },
      });
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const agency = await prisma.agency.findUnique({ where: { id: report.agencyId } });
    const dateRange = `${new Date(report.dateRangeStart).toLocaleDateString()} - ${new Date(report.dateRangeEnd).toLocaleDateString()}`;

    const { data, error } = await resend.emails.send({
      from: `${agency?.name || 'ReportCraft AI'} <reports@reportcraft.ai>`,
      to: [emailTo],
      subject: report.client.emailSubjectTemplate?.replace('{client}', report.client.name).replace('{date}', dateRange)
        || `${report.client.name} — Performance Report — ${dateRange}`,
      html: `<p>Hi ${report.client.contactName},</p><p>Please find your performance report for ${dateRange} attached.</p><p>Best regards,<br>${agency?.name}</p>`,
    });

    await prisma.reportDelivery.update({
      where: { id: deliveryId },
      data: {
        status: error ? 'failed' : 'sent',
        sentAt: error ? null : new Date(),
        resendEmailId: data?.id,
        failureReason: error ? String(error) : null,
      },
    });
  } catch (e: any) {
    await prisma.reportDelivery.update({
      where: { id: deliveryId },
      data: { status: 'failed', failureReason: e.message },
    });
  }
}

export default router;
