"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = __importDefault(require("../lib/db"));
const router = (0, express_1.Router)();
const inviteSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    role: zod_1.z.enum(['admin', 'analyst', 'viewer']),
});
router.get('/', async (req, res) => {
    const members = await db_1.default.teamMember.findMany({
        where: { agencyId: req.agencyId, removedAt: null },
        orderBy: { createdAt: 'asc' },
    });
    res.json(members);
});
router.post('/invite', async (req, res) => {
    try {
        const data = inviteSchema.parse(req.body);
        const existing = await db_1.default.teamMember.findFirst({
            where: { agencyId: req.agencyId, email: data.email, removedAt: null },
        });
        if (existing)
            return res.status(400).json({ error: 'Member with this email already exists' });
        const member = await db_1.default.teamMember.create({
            data: { ...data, agencyId: req.agencyId },
        });
        res.status(201).json(member);
    }
    catch (e) {
        if (e.name === 'ZodError')
            return res.status(400).json({ error: e.errors });
        throw e;
    }
});
router.put('/:memberId', async (req, res) => {
    const { role } = req.body;
    const member = await db_1.default.teamMember.findFirst({
        where: { id: req.params.memberId, agencyId: req.agencyId, removedAt: null },
    });
    if (!member)
        return res.status(404).json({ error: 'Member not found' });
    if (member.role === 'owner')
        return res.status(403).json({ error: 'Cannot change owner role' });
    const updated = await db_1.default.teamMember.update({ where: { id: member.id }, data: { role } });
    res.json(updated);
});
router.delete('/:memberId', async (req, res) => {
    const member = await db_1.default.teamMember.findFirst({
        where: { id: req.params.memberId, agencyId: req.agencyId, removedAt: null },
    });
    if (!member)
        return res.status(404).json({ error: 'Member not found' });
    if (member.role === 'owner')
        return res.status(403).json({ error: 'Cannot remove owner' });
    await db_1.default.teamMember.update({ where: { id: member.id }, data: { removedAt: new Date() } });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=team.js.map