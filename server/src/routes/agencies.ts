import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const updateAgencySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  timezone: z.string().optional(),
  narrativeTone: z.enum(['professional', 'conversational', 'executive']).optional(),
  anomalyAlertsEnabled: z.boolean().optional(),
});

router.get('/me', async (req: Request, res: Response) => {
  const agency = await prisma.agency.findUnique({ where: { id: req.agencyId } });
  if (!agency) return res.status(404).json({ error: 'Agency not found' });
  res.json(agency);
});

router.put('/me', async (req: Request, res: Response) => {
  try {
    const data = updateAgencySchema.parse(req.body);
    const agency = await prisma.agency.update({ where: { id: req.agencyId }, data });
    res.json(agency);
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    throw e;
  }
});

router.post('/me/logo', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!allowed.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type. PNG, JPG, or SVG only.' });
  }

  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `reportcraft/logos/${req.agencyId}`, resource_type: 'auto' },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });
      const agency = await prisma.agency.update({
        where: { id: req.agencyId },
        data: { logoUrl: uploadResult.secure_url },
      });
      return res.json({ url: uploadResult.secure_url, agency });
    } else {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const agency = await prisma.agency.update({
        where: { id: req.agencyId },
        data: { logoUrl: base64 },
      });
      return res.json({ url: base64, agency });
    }
  } catch (e) {
    console.error('Logo upload error:', e);
    return res.status(500).json({ error: 'Logo upload failed' });
  }
});

export default router;
