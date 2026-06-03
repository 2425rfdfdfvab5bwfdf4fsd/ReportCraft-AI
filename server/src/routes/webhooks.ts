import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Webhook } from 'svix';
import prisma from '../lib/db';

const router = Router();

router.post('/clerk', async (req: Request, res: Response) => {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    const payload = wh.verify(JSON.stringify(req.body), {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    }) as any;

    const { type, data } = payload;

    if (type === 'user.created') {
      const existing = await prisma.agency.findUnique({ where: { clerkUserId: data.id } });
      if (!existing) {
        await prisma.agency.create({
          data: {
            clerkUserId: data.id,
            subscriptionTier: 'FREE_TRIAL',
            subscriptionStatus: 'trial',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          },
        });
      }
    }

    if (type === 'user.deleted') {
      const agency = await prisma.agency.findUnique({ where: { clerkUserId: data.id } });
      if (agency) {
        await prisma.agency.update({
          where: { id: agency.id },
          data: { subscriptionStatus: 'cancelled' },
        });
      }
    }

    res.json({ received: true });
  } catch (e) {
    if (!CLERK_WEBHOOK_SECRET) return res.json({ received: true });
    console.error('Clerk webhook error:', e);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});

router.post('/lemonsqueezy', async (req: Request, res: Response) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

  try {
    const sig = req.headers['x-signature'] as string;
    if (sig && secret) {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(JSON.stringify(req.body));
      const expected = hmac.digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const { meta, data } = req.body;
    const eventName = meta?.event_name;
    const customData = meta?.custom_data;
    const agencyId = customData?.agency_id;

    if (!agencyId) {
      console.warn('LS webhook: no agency_id in custom_data');
      return res.json({ received: true });
    }

    const TIER_MAP: Record<string, string> = {
      [process.env.LS_STARTER_VARIANT_ID || '']: 'STARTER',
      [process.env.LS_AGENCY_VARIANT_ID || '']: 'AGENCY',
      [process.env.LS_AGENCY_PRO_VARIANT_ID || '']: 'AGENCY_PRO',
    };

    const variantId = String(data?.attributes?.variant_id || '');
    const tier = TIER_MAP[variantId];

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      if (!tier) {
        console.warn(`LS webhook: unknown variantId ${variantId}`, req.body);
        return res.json({ received: true });
      }

      await prisma.agency.update({
        where: { id: agencyId },
        data: {
          subscriptionTier: tier as any,
          subscriptionStatus: data?.attributes?.status === 'active' ? 'active' : 'past_due',
          lemonSqueezySubscriptionId: String(data?.id || ''),
          lemonSqueezyVariantId: variantId,
          currentPeriodEnd: data?.attributes?.renews_at ? new Date(data.attributes.renews_at) : null,
        },
      });
    } else if (eventName === 'subscription_cancelled') {
      await prisma.agency.update({
        where: { id: agencyId },
        data: { subscriptionStatus: 'cancelled', currentPeriodEnd: data?.attributes?.ends_at ? new Date(data.attributes.ends_at) : null },
      });
    } else if (eventName === 'subscription_expired') {
      await prisma.agency.update({
        where: { id: agencyId },
        data: { subscriptionStatus: 'cancelled' },
      });
    }

    res.json({ received: true });
  } catch (e) {
    console.error('LS webhook error:', e);
    res.json({ received: true });
  }
});

router.post('/resend', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    const emailId = data?.email_id;
    if (!emailId) return res.json({ received: true });

    const delivery = await prisma.reportDelivery.findFirst({ where: { resendEmailId: emailId } });
    if (!delivery) return res.json({ received: true });

    if (type === 'email.delivered') {
      await prisma.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'delivered', deliveredAt: new Date() } });
    } else if (type === 'email.opened') {
      await prisma.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'opened', openedAt: new Date() } });
    } else if (type === 'email.bounced') {
      await prisma.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'bounced', failureReason: 'Email bounced' } });
    }

    res.json({ received: true });
  } catch (e) {
    console.error('Resend webhook error:', e);
    res.json({ received: true });
  }
});

export default router;
