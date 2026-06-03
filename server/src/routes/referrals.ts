import { Router, Request, Response } from 'express';
import prisma from '../lib/db';

const router = Router();

router.get('/me', async (req: Request, res: Response) => {
  const agency = await prisma.agency.findUnique({
    where: { id: req.agencyId },
    select: {
      referralCode: true,
      referredByCode: true,
      subscriptionTier: true,
    },
  });

  if (!agency) return res.status(404).json({ error: 'Agency not found' });

  // Only active paid agencies have an active referral code
  const isPaid = ['STARTER', 'AGENCY', 'AGENCY_PRO'].includes(agency.subscriptionTier);

  // Count how many agencies were referred by this agency's code
  const referralCount = agency.referralCode
    ? await prisma.agency.count({ where: { referredByCode: agency.referralCode } })
    : 0;

  res.json({
    referralCode: isPaid ? agency.referralCode : null,
    referralLink: isPaid && agency.referralCode
      ? `${process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}?ref=${agency.referralCode}`
      : null,
    referralCount,
    referredByCode: agency.referredByCode,
    isPaid,
  });
});

export default router;
