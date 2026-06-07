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
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const db_1 = __importDefault(require("../lib/db"));
const config_1 = require("../config");
const DEMO_CLERK_USER_ID = 'demo_user_replit';
let _demoAgencyCache = null;
async function getDemoAgency() {
    if (_demoAgencyCache)
        return _demoAgencyCache;
    const existing = await db_1.default.agency.findUnique({ where: { clerkUserId: DEMO_CLERK_USER_ID } });
    if (existing) {
        _demoAgencyCache = existing;
        return existing;
    }
    try {
        const created = await db_1.default.agency.create({
            data: {
                clerkUserId: DEMO_CLERK_USER_ID,
                name: 'Demo Agency',
                subscriptionTier: 'AGENCY',
                subscriptionStatus: 'active',
                trialEndsAt: new Date(Date.now() + config_1.config.trial.demoDurationDays * 24 * 60 * 60 * 1000),
                referralCode: 'DEMO1234',
                onboardingCompletedAt: new Date(),
                brandColor: '#6366F1',
            },
        });
        _demoAgencyCache = created;
        return created;
    }
    catch (e) {
        if (e.code === 'P2002') {
            const found = await db_1.default.agency.findUniqueOrThrow({ where: { clerkUserId: DEMO_CLERK_USER_ID } });
            _demoAgencyCache = found;
            return found;
        }
        throw e;
    }
}
async function authMiddleware(req, res, next) {
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
        let payload;
        try {
            const { createClerkClient } = await Promise.resolve().then(() => __importStar(require('@clerk/clerk-sdk-node')));
            const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
            payload = await clerkClient.verifyToken(token);
        }
        catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const clerkUserId = payload.sub;
        let agency = await db_1.default.agency.findUnique({ where: { clerkUserId } });
        if (!agency) {
            agency = await db_1.default.agency.create({
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
        const teamMember = await db_1.default.teamMember.findFirst({
            where: { agencyId: agency.id, clerkUserId, removedAt: null },
        });
        if (teamMember) {
            req.teamMemberRole = teamMember.role;
        }
        else if (agency.clerkUserId === clerkUserId) {
            req.teamMemberRole = 'owner';
        }
        next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.teamMemberRole || !roles.includes(req.teamMemberRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map