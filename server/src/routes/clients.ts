import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db';

const router = Router();

const TIER_CLIENT_LIMITS: Record<string, number> = {
  FREE_TRIAL: 15,
  STARTER: 5,
  AGENCY: 15,
  AGENCY_PRO: Infinity,
};

const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
});

const updateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  industry: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  goals: z.any().optional(),
  emailSubjectTemplate: z.string().optional(),
  emailBodyTemplate: z.string().optional(),
  anomalyAlertsEnabled: z.boolean().optional(),
  archivedAt: z.string().nullable().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    where: { agencyId: req.agencyId, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      clientConnectors: { include: { oauthToken: true } },
      reports: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  res.json(clients);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createClientSchema.parse(req.body);

    const agency = await prisma.agency.findUnique({ where: { id: req.agencyId } });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });

    const limit = TIER_CLIENT_LIMITS[agency.subscriptionTier] ?? 5;
    const activeCount = await prisma.client.count({
      where: { agencyId: req.agencyId, archivedAt: null },
    });

    if (activeCount >= limit) {
      return res.status(403).json({
        error: 'CLIENT_LIMIT_EXCEEDED',
        activeClients: activeCount,
        limit,
        message: `You have reached your ${limit}-client limit. Please upgrade to add more clients.`,
      });
    }

    const client = await prisma.client.create({ data: { ...data, agencyId: req.agencyId } });
    res.status(201).json(client);
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    throw e;
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
    include: {
      clientConnectors: { include: { oauthToken: { select: { id: true, platform: true, accountName: true, status: true } } } },
      reports: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updateClientSchema.parse(req.body);
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...data,
        archivedAt: data.archivedAt !== undefined
          ? (data.archivedAt ? new Date(data.archivedAt) : null)
          : undefined,
      },
    });
    res.json(updated);
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    throw e;
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  await prisma.client.update({
    where: { id: req.params.id },
    data: { archivedAt: new Date() },
  });
  res.json({ success: true });
});

router.put('/:id/schedule', async (req: Request, res: Response) => {
  const { schedule, timezone } = req.body;
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const updated = await prisma.client.update({
    where: { id: req.params.id },
    data: { reportSchedule: schedule, reportScheduleTimezone: timezone },
  });
  res.json(updated);
});

router.get('/:id/connectors', async (req: Request, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const connectors = await prisma.clientConnector.findMany({
    where: { clientId: req.params.id },
    include: { oauthToken: { select: { id: true, platform: true, accountName: true, status: true, createdAt: true } } },
  });
  res.json(connectors);
});

router.post('/:id/connectors', async (req: Request, res: Response) => {
  const { oauthTokenId } = req.body;
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const token = await prisma.oAuthToken.findFirst({
    where: { id: oauthTokenId, agencyId: req.agencyId },
  });
  if (!token) return res.status(404).json({ error: 'Token not found' });

  const connector = await prisma.clientConnector.upsert({
    where: { clientId_oauthTokenId: { clientId: req.params.id, oauthTokenId } },
    create: { clientId: req.params.id, oauthTokenId },
    update: {},
  });
  res.status(201).json(connector);
});

router.delete('/:clientId/connectors/:connectorId', async (req: Request, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.clientId, agencyId: req.agencyId },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  await prisma.clientConnector.delete({ where: { id: req.params.connectorId } });
  res.json({ success: true });
});

router.get('/:id/deliveries', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const [deliveries, total] = await Promise.all([
    prisma.reportDelivery.findMany({
      where: { clientId: req.params.id, agencyId: req.agencyId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reportDelivery.count({ where: { clientId: req.params.id, agencyId: req.agencyId } }),
  ]);
  res.json({ deliveries, total });
});

export default router;
