"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const router = (0, express_1.Router)();
router.get('/me', async (req, res) => {
    const agency = await db_1.default.agency.findUnique({
        where: { id: req.agencyId },
        select: {
            referralCode: true,
            referredByCode: true,
            subscriptionTier: true,
        },
    });
    if (!agency)
        return res.status(404).json({ error: 'Agency not found' });
    // Only active paid agencies have an active referral code
    const isPaid = ['STARTER', 'AGENCY', 'AGENCY_PRO'].includes(agency.subscriptionTier);
    // Count how many agencies were referred by this agency's code
    const [referralCount, convertedCount] = await Promise.all([
        agency.referralCode
            ? db_1.default.agency.count({ where: { referredByCode: agency.referralCode } })
            : Promise.resolve(0),
        agency.referralCode
            ? db_1.default.agency.count({
                where: {
                    referredByCode: agency.referralCode,
                    subscriptionTier: { in: ['STARTER', 'AGENCY', 'AGENCY_PRO'] },
                },
            })
            : Promise.resolve(0),
    ]);
    res.json({
        referralCode: isPaid ? agency.referralCode : null,
        referralLink: isPaid && agency.referralCode
            ? `${process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}?ref=${agency.referralCode}`
            : null,
        referralCount,
        converted: convertedCount,
        creditsEarned: convertedCount,
        referredByCode: agency.referredByCode,
        isPaid,
    });
});
exports.default = router;
//# sourceMappingURL=referrals.js.map