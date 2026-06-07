import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/db';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      agencyId: string;
      clerkUserId: string;
      teamMemberRole?: string;
    }
  }
}

const DEMO_CLERK_USER_ID = 'demo_user_replit';

let _demoAgencyCache: any = null;

async function getDemoAgency() {
  if (_demoAgencyCache) return _demoAgencyCache;

  const existing = await prisma.agency.findUnique({ where: { clerkUserId: DEMO_CLERK_USER_ID } });
  if (existing) {
    _demoAgencyCache = existing;
    return existing;
  }

  try {
    const created = await prisma.agency.create({
      data: {
        clerkUserId: DEMO_CLERK_USER_ID,
        name: 'Demo Agency',
        subscriptionTier: 'AGENCY',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + config.trial.demoDurationDays * 24 * 60 * 60 * 1000),
        referralCode: 'DEMO1234',
        onboardingCompletedAt: new Date(),
        brandColor: '#6366F1',
      },
    });
    _demoAgencyCache = created;
    return created;
  } catch (e: any) {
    if (e.code === 'P2002') {
      const found = await prisma.agency.findUniqueOrThrow({ where: { clerkUserId: DEMO_CLERK_USER_ID } });
      _demoAgencyCache = found;
      return found;
    }
    throw e;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    // Demo mode: no Clerk key configured
    if (!clerkSecretKey) {
      const agency = await getDemoAgency();
      req.agencyId = agency.id;
      req.clerkUserId = DEMO_CLERK_USER_ID;
      req.teamMemberRole = 'owner';
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    let payload: any;
    try {
      const { createClerkClient } = await import('@clerk/clerk-sdk-node');
      const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
      payload = await clerkClient.verifyToken(token);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const clerkUserId = payload.sub;

    let agency = await prisma.agency.findUnique({ where: { clerkUserId } });

    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          clerkUserId,
          subscriptionTier: 'FREE_TRIAL',
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        },
      });
      console.warn(`webhook_recovery: created agency on-the-fly for clerk user ${clerkUserId}`);
    }

    req.agencyId = agency.id;
    req.clerkUserId = clerkUserId;

    const teamMember = await prisma.teamMember.findFirst({
      where: { agencyId: agency.id, clerkUserId, removedAt: null },
    });
    if (teamMember) {
      req.teamMemberRole = teamMember.role;
    } else if (agency.clerkUserId === clerkUserId) {
      req.teamMemberRole = 'owner';
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.teamMemberRole || !roles.includes(req.teamMemberRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
