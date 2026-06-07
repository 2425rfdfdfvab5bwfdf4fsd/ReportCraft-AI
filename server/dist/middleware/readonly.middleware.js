"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readOnlyGuard = readOnlyGuard;
const db_1 = __importDefault(require("../lib/db"));
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const READ_ONLY_EXEMPT = [
    '/api/agencies/me',
    '/api/team',
];
const PAST_DUE_GRACE_DAYS = 3;
async function readOnlyGuard(req, res, next) {
    if (!WRITE_METHODS.includes(req.method))
        return next();
    // Allow GET/HEAD always; allow billing-related writes
    const path = req.path;
    if (path.startsWith('/api/webhooks'))
        return next();
    try {
        const agency = await db_1.default.agency.findUnique({
            where: { id: req.agencyId },
            select: {
                subscriptionStatus: true,
                subscriptionTier: true,
                trialEndsAt: true,
                pastDueAt: true,
            },
        });
        if (!agency)
            return next();
        const now = new Date();
        // Check trial expiry
        if (agency.subscriptionStatus === 'trial' &&
            agency.trialEndsAt &&
            agency.trialEndsAt < now) {
            return res.status(403).json({
                error: 'ACCOUNT_READ_ONLY',
                reason: 'trial_expired',
                message: 'Your free trial has ended. Please upgrade to continue.',
            });
        }
        // Check past_due exceeding 3-day grace period
        if (agency.subscriptionStatus === 'past_due' && agency.pastDueAt) {
            const gracePeriodEnd = new Date(agency.pastDueAt.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
            if (now > gracePeriodEnd) {
                return res.status(403).json({
                    error: 'ACCOUNT_READ_ONLY',
                    reason: 'past_due_grace_expired',
                    message: 'Your account is past due. Please update your payment method to continue.',
                });
            }
        }
        // Check cancelled
        if (agency.subscriptionStatus === 'cancelled') {
            return res.status(403).json({
                error: 'ACCOUNT_READ_ONLY',
                reason: 'subscription_cancelled',
                message: 'Your subscription has been cancelled. Please resubscribe to continue.',
            });
        }
        next();
    }
    catch (err) {
        console.error('readOnlyGuard error:', err);
        next();
    }
}
//# sourceMappingURL=readonly.middleware.js.map