"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = __importDefault(require("../lib/db"));
const router = (0, express_1.Router)();
const TIER_CLIENT_LIMITS = {
    FREE_TRIAL: 15,
    STARTER: 5,
    AGENCY: 15,
    AGENCY_PRO: Infinity,
};
const createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    industry: zod_1.z.string().optional(),
    websiteUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    contactName: zod_1.z.string().min(1),
    contactEmail: zod_1.z.string().email(),
});
const updateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    industry: zod_1.z.string().optional(),
    websiteUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    contactName: zod_1.z.string().min(1).optional(),
    contactEmail: zod_1.z.string().email().optional(),
    goals: zod_1.z.any().optional(),
    emailSubjectTemplate: zod_1.z.string().optional(),
    emailBodyTemplate: zod_1.z.string().optional(),
    anomalyAlertsEnabled: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['active', 'paused']).optional(),
    archivedAt: zod_1.z.string().nullable().optional(),
});
router.get('/', async (req, res) => {
    const clients = await db_1.default.client.findMany({
        where: { agencyId: req.agencyId, archivedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
            clientConnectors: { include: { oauthToken: true } },
            reports: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
    });
    res.json(clients);
});
router.post('/', async (req, res) => {
    try {
        const data = createClientSchema.parse(req.body);
        const agency = await db_1.default.agency.findUnique({ where: { id: req.agencyId } });
        if (!agency)
            return res.status(404).json({ error: 'Agency not found' });
        const limit = TIER_CLIENT_LIMITS[agency.subscriptionTier] ?? 5;
        const activeCount = await db_1.default.client.count({
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
        const client = await db_1.default.client.create({ data: { ...data, agencyId: req.agencyId } });
        res.status(201).json(client);
    }
    catch (e) {
        if (e.name === 'ZodError')
            return res.status(400).json({ error: e.errors });
        throw e;
    }
});
router.get('/:id', async (req, res) => {
    const client = await db_1.default.client.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
        include: {
            clientConnectors: { include: { oauthToken: { select: { id: true, platform: true, accountName: true, status: true } } } },
            reports: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
    });
    if (!client)
        return res.status(404).json({ error: 'Client not found' });
    res.json(client);
});
router.put('/:id', async (req, res) => {
    try {
        const data = updateClientSchema.parse(req.body);
        const client = await db_1.default.client.findFirst({
            where: { id: req.params.id, agencyId: req.agencyId },
        });
        if (!client)
            return res.status(404).json({ error: 'Client not found' });
        const updated = await db_1.default.client.update({
            where: { id: req.params.id },
            data: {
                ...data,
                archivedAt: data.archivedAt !== undefined
                    ? (data.archivedAt ? new Date(data.archivedAt) : null)
                    : undefined,
            },
        });
        res.json(updated);
    }
    catch (e) {
        if (e.name === 'ZodError')
            return res.status(400).json({ error: e.errors });
        throw e;
    }
});
router.delete('/:id', async (req, res) => {
    const client = await db_1.default.client.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!client)
        return res.status(404).json({ error: 'Client not found' });
    await db_1.default.client.update({
        where: { id: req.params.id },
        data: { archivedAt: new Date() },
    });
    res.json({ success: true });
});
router.put('/:id/schedule', async (req, res) => {
    const { schedule, timezone } = req.body;
    const client = await db_1.default.client.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!client)
        return res.status(404).json({ error: 'Client not found' });
    const updated = await db_1.default.client.update({
        where: { id: req.params.id },
        data: { reportSchedule: schedule, reportScheduleTimezone: timezone },
    });
    res.json(updated);
});
router.get('/:id/connectors', async (req, res) => {
    const client = await db_1.default.client.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!client)
        return res.status(404).json({ error: 'Client not found' });
    const connectors = await db_1.default.clientConnector.findMany({
        where: { clientId: req.params.id },
        include: { oauthToken: { select: { id: true, platform: true, accountName: true, status: true, createdAt: true } } },
    });
    res.json(connectors);
});
router.post('/:id/connectors', async (req, res) => {
    const { oauthTokenId } = req.body;
    const client = await db_1.default.client.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!client)
        return res.status(404).json({ error: 'Client not found' });
    const token = await db_1.default.oAuthToken.findFirst({
        where: { id: oauthTokenId, agencyId: req.agencyId },
    });
    if (!token)
        return res.status(404).json({ error: 'Token not found' });
    const connector = await db_1.default.clientConnector.upsert({
        where: { clientId_oauthTokenId: { clientId: req.params.id, oauthTokenId } },
        create: { clientId: req.params.id, oauthTokenId },
        update: {},
    });
    res.status(201).json(connector);
});
router.delete('/:clientId/connectors/:connectorId', async (req, res) => {
    const client = await db_1.default.client.findFirst({
        where: { id: req.params.clientId, agencyId: req.agencyId },
    });
    if (!client)
        return res.status(404).json({ error: 'Client not found' });
    await db_1.default.clientConnector.delete({ where: { id: req.params.connectorId } });
    res.json({ success: true });
});
router.get('/:id/deliveries', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const [deliveries, total] = await Promise.all([
        db_1.default.reportDelivery.findMany({
            where: { clientId: req.params.id, agencyId: req.agencyId },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.default.reportDelivery.count({ where: { clientId: req.params.id, agencyId: req.agencyId } }),
    ]);
    res.json({ deliveries, total });
});
exports.default = router;
//# sourceMappingURL=clients.js.map