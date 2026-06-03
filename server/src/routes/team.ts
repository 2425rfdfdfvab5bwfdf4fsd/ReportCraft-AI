import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db';

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'analyst', 'viewer']),
});

router.get('/', async (req: Request, res: Response) => {
  const members = await prisma.teamMember.findMany({
    where: { agencyId: req.agencyId, removedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  res.json(members);
});

router.post('/invite', async (req: Request, res: Response) => {
  try {
    const data = inviteSchema.parse(req.body);
    const existing = await prisma.teamMember.findFirst({
      where: { agencyId: req.agencyId, email: data.email, removedAt: null },
    });
    if (existing) return res.status(400).json({ error: 'Member with this email already exists' });

    const member = await prisma.teamMember.create({
      data: { ...data, agencyId: req.agencyId },
    });
    res.status(201).json(member);
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    throw e;
  }
});

router.put('/:memberId', async (req: Request, res: Response) => {
  const { role } = req.body;
  const member = await prisma.teamMember.findFirst({
    where: { id: req.params.memberId, agencyId: req.agencyId, removedAt: null },
  });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.role === 'owner') return res.status(403).json({ error: 'Cannot change owner role' });

  const updated = await prisma.teamMember.update({ where: { id: member.id }, data: { role } });
  res.json(updated);
});

router.delete('/:memberId', async (req: Request, res: Response) => {
  const member = await prisma.teamMember.findFirst({
    where: { id: req.params.memberId, agencyId: req.agencyId, removedAt: null },
  });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.role === 'owner') return res.status(403).json({ error: 'Cannot remove owner' });

  await prisma.teamMember.update({ where: { id: member.id }, data: { removedAt: new Date() } });
  res.json({ success: true });
});

export default router;
