"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../lib/db"));
const encryption_1 = require("../lib/encryption");
const config_1 = require("../config");
const router = (0, express_1.Router)();
// ─── URL helpers ──────────────────────────────────────────────────────────────
function getServerUrl() {
    return process.env.SERVER_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
}
function getFrontendUrl() {
    return process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
}
/** Builds the OAuth redirect URI for a given platform slug (e.g. "google"). */
function buildRedirectUri(platform) {
    return `${getServerUrl()}/api/connectors/${platform}/callback`;
}
/**
 * Creates a HMAC-signed, base64-encoded state token for CSRF protection.
 * Valid for `config.oauth.stateExpiryMs` milliseconds.
 */
function generateState(agencyId, platform) {
    const payload = JSON.stringify({ agencyId, platform, exp: Date.now() + config_1.config.oauth.stateExpiryMs });
    const hmac = crypto_1.default.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'dev-secret');
    hmac.update(payload);
    return Buffer.from(payload).toString('base64') + '.' + hmac.digest('hex');
}
/**
 * Verifies the state token signature and expiry.
 * Returns the decoded payload on success, or `null` if invalid.
 */
function verifyState(state) {
    try {
        const [payloadB64, sig] = state.split('.');
        const payload = Buffer.from(payloadB64, 'base64').toString();
        const hmac = crypto_1.default.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'dev-secret');
        hmac.update(payload);
        const expected = hmac.digest('hex');
        if (!crypto_1.default.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
            return null;
        const data = JSON.parse(payload);
        if (data.exp < Date.now())
            return null;
        return data;
    }
    catch {
        return null;
    }
}
// ─── Routes ───────────────────────────────────────────────────────────────────
/** List all OAuth tokens for the authenticated agency. */
router.get('/', async (req, res) => {
    const tokens = await db_1.default.oAuthToken.findMany({
        where: { agencyId: req.agencyId },
        select: {
            id: true, platform: true, accountId: true, accountName: true,
            tokenExpiresAt: true, status: true, errorMessage: true,
            lastRefreshedAt: true, createdAt: true,
        },
    });
    res.json(tokens);
});
// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google/auth-url', async (req, res) => {
    const platform = req.query.platform || 'google_analytics';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = buildRedirectUri('google');
    if (!clientId) {
        return res.json({ url: null, demo: true, message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to enable.' });
    }
    const scopes = platform === 'google_ads'
        ? ['https://www.googleapis.com/auth/adwords']
        : ['https://www.googleapis.com/auth/analytics.readonly'];
    const state = generateState(req.agencyId, platform);
    const url = `https://accounts.google.com/o/oauth2/v2/auth`
        + `?client_id=${clientId}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&response_type=code`
        + `&scope=${encodeURIComponent(scopes.join(' '))}`
        + `&access_type=offline&prompt=consent`
        + `&state=${encodeURIComponent(state)}`;
    res.json({ url });
});
router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const frontendUrl = getFrontendUrl();
    if (error)
        return res.redirect(`${frontendUrl}/connectors?error=cancelled`);
    const stateData = verifyState(state);
    if (!stateData)
        return res.redirect(`${frontendUrl}/connectors?error=invalid_state`);
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = buildRedirectUri('google');
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
        });
        const tokens = await tokenRes.json();
        if (tokens.error)
            throw new Error(tokens.error_description || tokens.error);
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const platform = stateData.platform === 'google_ads' ? 'google_ads' : 'google_analytics';
        await db_1.default.oAuthToken.create({
            data: {
                agencyId: stateData.agencyId,
                platform,
                accountId: userInfo.sub || userInfo.email,
                accountName: userInfo.name || userInfo.email,
                encryptedAccessToken: (0, encryption_1.encrypt)(tokens.access_token),
                encryptedRefreshToken: tokens.refresh_token ? (0, encryption_1.encrypt)(tokens.refresh_token) : null,
                tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
                scopes: tokens.scope?.split(' ') || [],
                status: 'active',
            },
        });
        res.redirect(`${frontendUrl}/connectors?success=google`);
    }
    catch (e) {
        console.error('[connectors] Google callback error:', e);
        res.redirect(`${frontendUrl}/connectors?error=oauth_failed`);
    }
});
// ── Meta OAuth ────────────────────────────────────────────────────────────────
router.get('/meta/auth-url', async (req, res) => {
    const clientId = process.env.META_APP_ID;
    if (!clientId) {
        return res.json({ url: null, demo: true, message: 'Meta OAuth not configured. Add META_APP_ID to enable.' });
    }
    const state = generateState(req.agencyId, 'meta_ads');
    const redirectUri = buildRedirectUri('meta');
    const url = `https://www.facebook.com/v18.0/dialog/oauth`
        + `?client_id=${clientId}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&scope=ads_read,read_insights`
        + `&state=${encodeURIComponent(state)}`;
    res.json({ url });
});
router.get('/meta/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const frontendUrl = getFrontendUrl();
    if (error)
        return res.redirect(`${frontendUrl}/connectors?error=cancelled`);
    const stateData = verifyState(state);
    if (!stateData)
        return res.redirect(`${frontendUrl}/connectors?error=invalid_state`);
    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const redirectUri = buildRedirectUri('meta');
        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token`
            + `?client_id=${appId}&client_secret=${appSecret}`
            + `&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
        const tokens = await tokenRes.json();
        if (tokens.error)
            throw new Error(tokens.error);
        const meRes = await fetch(`https://graph.facebook.com/me?access_token=${tokens.access_token}`);
        const me = await meRes.json();
        // Meta short-lived tokens expire after 60 days when no expires_in is provided
        const expiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        await db_1.default.oAuthToken.create({
            data: {
                agencyId: stateData.agencyId,
                platform: 'meta_ads',
                accountId: me.id,
                accountName: me.name || me.id,
                encryptedAccessToken: (0, encryption_1.encrypt)(tokens.access_token),
                tokenExpiresAt: expiresAt,
                scopes: ['ads_read', 'read_insights'],
                status: 'active',
            },
        });
        res.redirect(`${frontendUrl}/connectors?success=meta`);
    }
    catch (e) {
        console.error('[connectors] Meta callback error:', e);
        res.redirect(`${frontendUrl}/connectors?error=oauth_failed`);
    }
});
// ── LinkedIn OAuth ────────────────────────────────────────────────────────────
router.get('/linkedin/auth-url', async (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
        return res.json({
            url: null,
            comingSoon: true,
            message: 'LinkedIn Ads connector requires MDP Standard Tier approval. Coming soon.',
        });
    }
    const state = generateState(req.agencyId, 'linkedin_ads');
    const redirectUri = buildRedirectUri('linkedin');
    const scopes = ['r_ads', 'r_ads_reporting', 'r_organization_social'].join('%20');
    const url = `https://www.linkedin.com/oauth/v2/authorization`
        + `?response_type=code&client_id=${clientId}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&scope=${scopes}&state=${encodeURIComponent(state)}`;
    res.json({ url });
});
router.get('/linkedin/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const frontendUrl = getFrontendUrl();
    if (error)
        return res.redirect(`${frontendUrl}/connectors?error=cancelled`);
    if (!process.env.LINKEDIN_CLIENT_ID)
        return res.redirect(`${frontendUrl}/connectors?error=linkedin_not_available`);
    const stateData = verifyState(state);
    if (!stateData)
        return res.redirect(`${frontendUrl}/connectors?error=invalid_state`);
    try {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const redirectUri = buildRedirectUri('linkedin');
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret }),
        });
        const tokens = await tokenRes.json();
        if (tokens.error)
            throw new Error(tokens.error_description || tokens.error);
        const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const me = await meRes.json();
        await db_1.default.oAuthToken.create({
            data: {
                agencyId: stateData.agencyId,
                platform: 'linkedin_ads',
                accountId: me.sub || me.email,
                accountName: me.name || me.email || 'LinkedIn Account',
                encryptedAccessToken: (0, encryption_1.encrypt)(tokens.access_token),
                encryptedRefreshToken: tokens.refresh_token ? (0, encryption_1.encrypt)(tokens.refresh_token) : null,
                tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
                scopes: ['r_ads', 'r_ads_reporting', 'r_organization_social'],
                status: 'active',
            },
        });
        res.redirect(`${frontendUrl}/connectors?success=linkedin`);
    }
    catch (e) {
        console.error('[connectors] LinkedIn callback error:', e);
        res.redirect(`${frontendUrl}/connectors?error=oauth_failed`);
    }
});
// ── Token management ──────────────────────────────────────────────────────────
/** Manually refresh an expired Google OAuth access token using its refresh token. */
router.post('/:id/refresh', async (req, res) => {
    const token = await db_1.default.oAuthToken.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!token)
        return res.status(404).json({ error: 'Connector not found' });
    if (!token.encryptedRefreshToken) {
        return res.status(400).json({ error: 'No refresh token available for this connector' });
    }
    try {
        const refreshToken = (0, encryption_1.decrypt)(token.encryptedRefreshToken);
        let newAccessToken;
        let expiresIn;
        if (token.platform === 'google_analytics' || token.platform === 'google_ads') {
            const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }),
            });
            const data = await refreshRes.json();
            if (data.error)
                throw new Error(data.error_description || data.error);
            newAccessToken = data.access_token;
            expiresIn = data.expires_in || 3600;
        }
        else {
            return res.status(400).json({ error: `Token refresh not supported for platform: ${token.platform}` });
        }
        const updated = await db_1.default.oAuthToken.update({
            where: { id: token.id },
            data: {
                encryptedAccessToken: (0, encryption_1.encrypt)(newAccessToken),
                tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
                lastRefreshedAt: new Date(),
                status: 'active',
                errorMessage: null,
            },
            select: { id: true, platform: true, accountName: true, status: true, tokenExpiresAt: true, lastRefreshedAt: true },
        });
        res.json(updated);
    }
    catch (e) {
        const err = e;
        await db_1.default.oAuthToken.update({
            where: { id: token.id },
            data: { status: 'error', errorMessage: err.message },
        });
        res.status(500).json({ error: 'Token refresh failed', message: err.message });
    }
});
/** Create a demo connector for testing without real OAuth credentials. */
router.post('/demo', async (req, res) => {
    const { platform, accountName } = req.body;
    if (!platform || !accountName) {
        return res.status(400).json({ error: 'platform and accountName are required' });
    }
    const token = await db_1.default.oAuthToken.create({
        data: {
            agencyId: req.agencyId,
            platform,
            accountId: `demo_${Date.now()}`,
            accountName,
            encryptedAccessToken: (0, encryption_1.encrypt)('demo_access_token'),
            scopes: ['demo'],
            status: 'active',
        },
    });
    res.status(201).json({
        id: token.id, platform: token.platform, accountName: token.accountName, status: token.status,
    });
});
/** Remove a connector (revokes local token — does not call the provider's revoke endpoint). */
router.delete('/:id', async (req, res) => {
    const token = await db_1.default.oAuthToken.findFirst({
        where: { id: req.params.id, agencyId: req.agencyId },
    });
    if (!token)
        return res.status(404).json({ error: 'Connector not found' });
    await db_1.default.oAuthToken.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=connectors.js.map