"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const svix_1 = require("svix");
const db_1 = __importDefault(require("../lib/db"));
const router = (0, express_1.Router)();
router.post('/clerk', async (req, res) => {
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';
    try {
        const wh = new svix_1.Webhook(CLERK_WEBHOOK_SECRET);
        const payload = wh.verify(JSON.stringify(req.body), {
            'svix-id': req.headers['svix-id'],
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature'],
        });
        const { type, data } = payload;
        if (type === 'user.created') {
            const existing = await db_1.default.agency.findUnique({ where: { clerkUserId: data.id } });
            if (!existing) {
                await db_1.default.agency.create({
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
            const agency = await db_1.default.agency.findUnique({ where: { clerkUserId: data.id } });
            if (agency) {
                // Cancel active LS subscription before marking cancelled
                if (agency.lemonSqueezySubscriptionId && process.env.LEMONSQUEEZY_API_KEY) {
                    try {
                        await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${agency.lemonSqueezySubscriptionId}`, {
                            method: 'DELETE',
                            headers: {
                                Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
                                Accept: 'application/vnd.api+json',
                            },
                        });
                    }
                    catch (e) {
                        console.error('Failed to cancel LS subscription on user.deleted:', e);
                    }
                }
                await db_1.default.agency.update({
                    where: { id: agency.id },
                    data: { subscriptionStatus: 'cancelled' },
                });
            }
        }
        res.json({ received: true });
    }
    catch (e) {
        if (!CLERK_WEBHOOK_SECRET)
            return res.json({ received: true });
        console.error('Clerk webhook error:', e);
        res.status(400).json({ error: 'Webhook verification failed' });
    }
});
router.post('/lemonsqueezy', async (req, res) => {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';
    try {
        const sig = req.headers['x-signature'];
        if (sig && secret) {
            const hmac = crypto_1.default.createHmac('sha256', secret);
            hmac.update(JSON.stringify(req.body));
            const expected = hmac.digest('hex');
            if (!crypto_1.default.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
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
        const TIER_MAP = {
            [process.env.LS_STARTER_VARIANT_ID || '']: 'STARTER',
            [process.env.LS_AGENCY_VARIANT_ID || '']: 'AGENCY',
            [process.env.LS_AGENCY_PRO_VARIANT_ID || '']: 'AGENCY_PRO',
        };
        const variantId = String(data?.attributes?.variant_id || '');
        const tier = TIER_MAP[variantId];
        const lsStatus = data?.attributes?.status;
        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
            if (!tier) {
                console.warn(`LS webhook: unknown variantId ${variantId}`, req.body);
                return res.json({ received: true });
            }
            const isPastDue = lsStatus === 'past_due';
            await db_1.default.agency.update({
                where: { id: agencyId },
                data: {
                    subscriptionTier: tier,
                    subscriptionStatus: isPastDue ? 'past_due' : 'active',
                    lemonSqueezySubscriptionId: String(data?.id || ''),
                    lemonSqueezyVariantId: variantId,
                    currentPeriodEnd: data?.attributes?.renews_at ? new Date(data.attributes.renews_at) : null,
                    pastDueAt: isPastDue ? new Date() : null,
                },
            });
        }
        else if (eventName === 'subscription_payment_failed') {
            // Start the 3-day past_due grace period
            await db_1.default.agency.update({
                where: { id: agencyId },
                data: {
                    subscriptionStatus: 'past_due',
                    pastDueAt: new Date(),
                },
            });
        }
        else if (eventName === 'subscription_payment_success') {
            // Clear past_due on successful payment
            await db_1.default.agency.update({
                where: { id: agencyId },
                data: {
                    subscriptionStatus: 'active',
                    pastDueAt: null,
                },
            });
        }
        else if (eventName === 'subscription_cancelled') {
            await db_1.default.agency.update({
                where: { id: agencyId },
                data: {
                    subscriptionStatus: 'cancelled',
                    currentPeriodEnd: data?.attributes?.ends_at ? new Date(data.attributes.ends_at) : null,
                },
            });
        }
        else if (eventName === 'subscription_expired') {
            await db_1.default.agency.update({
                where: { id: agencyId },
                data: { subscriptionStatus: 'cancelled' },
            });
        }
        else if (eventName === 'order_refunded') {
            // Refund: revert to trial/cancelled state
            await db_1.default.agency.update({
                where: { id: agencyId },
                data: {
                    subscriptionStatus: 'cancelled',
                    subscriptionTier: 'FREE_TRIAL',
                },
            });
        }
        res.json({ received: true });
    }
    catch (e) {
        console.error('LS webhook error:', e);
        res.json({ received: true });
    }
});
router.post('/resend', async (req, res) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET || '';
    try {
        // Verify Resend webhook signature (HMAC-SHA256)
        if (secret) {
            const sig = req.headers['svix-signature'];
            const svixId = req.headers['svix-id'];
            const svixTimestamp = req.headers['svix-timestamp'];
            if (!sig || !svixId || !svixTimestamp) {
                return res.status(400).json({ error: 'Missing Resend webhook headers' });
            }
            // Resend uses svix for webhook delivery — verify using svix
            try {
                const { Webhook } = await Promise.resolve().then(() => __importStar(require('svix')));
                const wh = new Webhook(secret);
                wh.verify(JSON.stringify(req.body), {
                    'svix-id': svixId,
                    'svix-timestamp': svixTimestamp,
                    'svix-signature': sig,
                });
            }
            catch {
                return res.status(400).json({ error: 'Invalid Resend webhook signature' });
            }
        }
        const { type, data } = req.body;
        const emailId = data?.email_id;
        if (!emailId)
            return res.json({ received: true });
        const delivery = await db_1.default.reportDelivery.findFirst({ where: { resendEmailId: emailId } });
        if (!delivery)
            return res.json({ received: true });
        if (type === 'email.delivered') {
            await db_1.default.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'delivered', deliveredAt: new Date() } });
        }
        else if (type === 'email.opened') {
            await db_1.default.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'opened', openedAt: new Date() } });
        }
        else if (type === 'email.bounced') {
            await db_1.default.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'bounced', failureReason: 'Email bounced' } });
        }
        res.json({ received: true });
    }
    catch (e) {
        console.error('Resend webhook error:', e);
        res.json({ received: true });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map