import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { ConnectorPlatform, TokenStatus } from '@prisma/client';
import prisma from '../lib/db';
import { encrypt, decrypt } from '../lib/encryption';
import { config } from '../config';

const router = Router();

// ─── URL helpers ──────────────────────────────────────────────────────────────

function getServerUrl(): string {
  return process.env.SERVER_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
}

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
}

/** Builds the OAuth redirect URI for a given provider slug (e.g. "google"). */
function buildRedirectUri(platform: 'google' | 'meta' | 'linkedin'): string {
  return `${getServerUrl()}/api/connectors/${platform}/callback`;
}

// ─── State token helpers ──────────────────────────────────────────────────────

interface OAuthStatePayload {
  agencyId: string;
  platform: string;
  exp:      number;
}

/**
 * Creates a HMAC-signed, base64-encoded state token for CSRF protection.
 * Valid for `config.oauth.stateExpiryMs` milliseconds.
 */
function generateState(agencyId: string, platform: string): string {
  const payload = JSON.stringify({ agencyId, platform, exp: Date.now() + config.oauth.stateExpiryMs } satisfies OAuthStatePayload);
  const hmac    = crypto.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'dev-secret');
  hmac.update(payload);
  return Buffer.from(payload).toString('base64') + '.' + hmac.digest('hex');
}

/**
 * Verifies the state token signature and expiry.
 * Returns the decoded payload on success, or `null` if invalid / expired.
 */
function verifyState(state: string): OAuthStatePayload | null {
  try {
    const [payloadB64, sig] = state.split('.');
    const payload  = Buffer.from(payloadB64, 'base64').toString();
    const hmac     = crypto.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'dev-secret');
    hmac.update(payload);
    const expected = hmac.digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(payload) as OAuthStatePayload;
    return data.exp < Date.now() ? null : data;
  } catch {
    return null;
  }
}

// ─── OAuth callback factory ───────────────────────────────────────────────────

/**
 * Shape that every `exchangeCode` function must return.
 * These values are written directly to `prisma.oAuthToken.create`.
 */
interface OAuthTokenData {
  platform:              ConnectorPlatform;
  accountId:             string;
  accountName:           string;
  encryptedAccessToken:  string;
  encryptedRefreshToken?: string | null;
  tokenExpiresAt?:       Date | null;
  scopes:                string[];
  status:                TokenStatus;
}

interface OAuthCallbackConfig {
  /**
   * Exchange the authorization code for tokens and user-info.
   * Receives the full verified state payload (including `platform`) so providers
   * can determine the exact ConnectorPlatform to store (e.g. google_analytics vs google_ads).
   * Must throw on failure.
   */
  exchangeCode: (code: string, stateData: OAuthStatePayload) => Promise<OAuthTokenData>;
  /** Used in the success redirect query param, e.g. "google" → `?success=google` */
  successSlug: string;
}

/**
 * Returns an Express route handler that handles the common OAuth callback flow:
 *   1. Extract code / state / error from query
 *   2. Verify state (CSRF protection)
 *   3. Delegate to `exchangeCode` for provider-specific token exchange
 *   4. Persist the token in the database
 *   5. Redirect the user to /connectors with success or error
 */
function createOAuthCallbackHandler(cfg: OAuthCallbackConfig) {
  return async (req: Request, res: Response): Promise<void> => {
    const { code, state, error } = req.query as Record<string, string>;
    const frontendUrl = getFrontendUrl();

    if (error) { res.redirect(`${frontendUrl}/connectors?error=cancelled`); return; }

    const stateData = verifyState(state);
    if (!stateData) { res.redirect(`${frontendUrl}/connectors?error=invalid_state`); return; }

    try {
      const tokenData = await cfg.exchangeCode(code, stateData);
      await prisma.oAuthToken.create({
        data: { agencyId: stateData.agencyId, ...tokenData },
      });
      res.redirect(`${frontendUrl}/connectors?success=${cfg.successSlug}`);
    } catch (e) {
      console.error(`[connectors] ${cfg.successSlug} callback error:`, e);
      res.redirect(`${frontendUrl}/connectors?error=oauth_failed`);
    }
  };
}

// ─── Google token / userinfo shapes ──────────────────────────────────────────

interface GoogleTokenResponse {
  access_token:       string;
  refresh_token?:     string;
  expires_in?:        number;
  scope?:             string;
  error?:             string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?:   string;
  email?: string;
  name?:  string;
}

// ─── Meta token / userinfo shapes ────────────────────────────────────────────

interface MetaTokenResponse {
  access_token: string;
  expires_in?:  number;
  error?:       string;
}

interface MetaUserInfo {
  id:    string;
  name?: string;
}

// ─── LinkedIn token / userinfo shapes ────────────────────────────────────────

interface LinkedInTokenResponse {
  access_token:       string;
  refresh_token?:     string;
  expires_in?:        number;
  error?:             string;
  error_description?: string;
}

interface LinkedInUserInfo {
  sub?:   string;
  email?: string;
  name?:  string;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** List all OAuth tokens for the authenticated agency. */
router.get('/', async (req: Request, res: Response) => {
  const tokens = await prisma.oAuthToken.findMany({
    where:  { agencyId: req.agencyId },
    select: {
      id: true, platform: true, accountId: true, accountName: true,
      tokenExpiresAt: true, status: true, errorMessage: true,
      lastRefreshedAt: true, createdAt: true,
    },
  });
  res.json(tokens);
});

// ── Google OAuth ──────────────────────────────────────────────────────────────

router.get('/google/auth-url', async (req: Request, res: Response) => {
  const platform    = (req.query.platform as string) || 'google_analytics';
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = buildRedirectUri('google');

  if (!clientId) {
    return res.json({ url: null, demo: true, message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to enable.' });
  }

  const scopes = platform === 'google_ads'
    ? ['https://www.googleapis.com/auth/adwords']
    : ['https://www.googleapis.com/auth/analytics.readonly'];

  const state = generateState(req.agencyId, platform);
  const url   = `https://accounts.google.com/o/oauth2/v2/auth`
    + `?client_id=${clientId}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&response_type=code`
    + `&scope=${encodeURIComponent(scopes.join(' '))}`
    + `&access_type=offline&prompt=consent`
    + `&state=${encodeURIComponent(state)}`;

  res.json({ url });
});

router.get('/google/callback', createOAuthCallbackHandler({
  successSlug: 'google',
  async exchangeCode(code, stateData) {
    const clientId     = process.env.GOOGLE_CLIENT_ID     || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri  = buildRedirectUri('google');

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokens = await tokenRes.json() as GoogleTokenResponse;
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Fetch user info to get account display name
    const meRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const me    = await meRes.json() as GoogleUserInfo;

    // Use the platform recorded in the state token so Google Ads and Google Analytics
    // callbacks are stored under the correct ConnectorPlatform value.
    const platform = stateData.platform === 'google_ads'
      ? ConnectorPlatform.google_ads
      : ConnectorPlatform.google_analytics;

    return {
      platform,
      accountId:             me.sub    ?? me.email ?? '',
      accountName:           me.name   ?? me.email ?? '',
      encryptedAccessToken:  encrypt(tokens.access_token),
      encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt:        tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      scopes:                tokens.scope?.split(' ') || [],
      status:                TokenStatus.active,
    };
  },
}));

// ── Meta OAuth ────────────────────────────────────────────────────────────────

router.get('/meta/auth-url', async (req: Request, res: Response) => {
  const clientId = process.env.META_APP_ID;

  if (!clientId) {
    return res.json({ url: null, demo: true, message: 'Meta OAuth not configured. Add META_APP_ID to enable.' });
  }

  const state       = generateState(req.agencyId, 'meta_ads');
  const redirectUri = buildRedirectUri('meta');
  const url         = `https://www.facebook.com/v18.0/dialog/oauth`
    + `?client_id=${clientId}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&scope=ads_read,read_insights`
    + `&state=${encodeURIComponent(state)}`;

  res.json({ url });
});

router.get('/meta/callback', createOAuthCallbackHandler({
  successSlug: 'meta',
  async exchangeCode(code, _stateData) {
    const appId       = process.env.META_APP_ID     || '';
    const appSecret   = process.env.META_APP_SECRET || '';
    const redirectUri = buildRedirectUri('meta');

    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token`
      + `?client_id=${appId}&client_secret=${appSecret}`
      + `&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokens = await tokenRes.json() as MetaTokenResponse;
    if (tokens.error) throw new Error(tokens.error);

    const meRes = await fetch(`https://graph.facebook.com/me?access_token=${tokens.access_token}`);
    const me    = await meRes.json() as MetaUserInfo;

    // Meta short-lived tokens expire in 60 days when no expires_in is provided
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    return {
      platform:             ConnectorPlatform.meta_ads,
      accountId:            me.id,
      accountName:          me.name ?? me.id,
      encryptedAccessToken: encrypt(tokens.access_token),
      tokenExpiresAt,
      scopes:               ['ads_read', 'read_insights'],
      status:               TokenStatus.active,
    };
  },
}));

// ── LinkedIn OAuth ────────────────────────────────────────────────────────────

router.get('/linkedin/auth-url', async (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return res.json({ url: null, comingSoon: true, message: 'LinkedIn Ads connector requires MDP Standard Tier approval. Coming soon.' });
  }

  const state       = generateState(req.agencyId, 'linkedin_ads');
  const redirectUri = buildRedirectUri('linkedin');
  const scopes      = ['r_ads', 'r_ads_reporting', 'r_organization_social'].join('%20');
  const url         = `https://www.linkedin.com/oauth/v2/authorization`
    + `?response_type=code&client_id=${clientId}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&scope=${scopes}&state=${encodeURIComponent(state)}`;

  res.json({ url });
});

router.get('/linkedin/callback', async (req: Request, res: Response) => {
  // LinkedIn requires a guard before the factory since it may not be configured
  if (!process.env.LINKEDIN_CLIENT_ID) {
    return res.redirect(`${getFrontendUrl()}/connectors?error=linkedin_not_available`);
  }

  return createOAuthCallbackHandler({
    successSlug: 'linkedin',
    async exchangeCode(code, _stateData) {
      const clientId     = process.env.LINKEDIN_CLIENT_ID    || '';
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
      const redirectUri  = buildRedirectUri('linkedin');

      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret }),
      });
      const tokens = await tokenRes.json() as LinkedInTokenResponse;
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      const me    = await meRes.json() as LinkedInUserInfo;

      return {
        platform:              ConnectorPlatform.linkedin_ads,
        accountId:             me.sub    ?? me.email ?? '',
        accountName:           me.name   ?? me.email ?? '',
        encryptedAccessToken:  encrypt(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt:        tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scopes:                ['r_ads', 'r_ads_reporting', 'r_organization_social'],
        status:                TokenStatus.active,
      };
    },
  })(req, res);
});

// ── Token management ──────────────────────────────────────────────────────────

/** Manually refresh an expired Google OAuth access token using its stored refresh token. */
router.post('/:id/refresh', async (req: Request, res: Response) => {
  const token = await prisma.oAuthToken.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!token) return res.status(404).json({ error: 'Connector not found' });
  if (!token.encryptedRefreshToken) {
    return res.status(400).json({ error: 'No refresh token available for this connector' });
  }

  const isGoogle = token.platform === ConnectorPlatform.google_analytics
    || token.platform === ConnectorPlatform.google_ads;

  if (!isGoogle) {
    return res.status(400).json({ error: `Token refresh not supported for platform: ${token.platform}` });
  }

  try {
    const refreshToken = decrypt(token.encryptedRefreshToken);
    const refreshRes   = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID     || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    });
    const data = await refreshRes.json() as GoogleTokenResponse;
    if (data.error) throw new Error(data.error_description || data.error);

    const updated = await prisma.oAuthToken.update({
      where: { id: token.id },
      data: {
        encryptedAccessToken: encrypt(data.access_token),
        tokenExpiresAt:       new Date(Date.now() + (data.expires_in || 3600) * 1000),
        lastRefreshedAt:      new Date(),
        status:               'active',
        errorMessage:         null,
      },
      select: { id: true, platform: true, accountName: true, status: true, tokenExpiresAt: true, lastRefreshedAt: true },
    });

    res.json(updated);
  } catch (e: unknown) {
    const err = e as { message?: string };
    await prisma.oAuthToken.update({
      where: { id: token.id },
      data:  { status: 'error', errorMessage: err.message },
    });
    res.status(500).json({ error: 'Token refresh failed', message: err.message });
  }
});

/** Create a demo connector for testing without real OAuth credentials. */
router.post('/demo', async (req: Request, res: Response) => {
  const { platform, accountName } = req.body as { platform?: string; accountName?: string };
  if (!platform || !accountName) {
    return res.status(400).json({ error: 'platform and accountName are required' });
  }

  // Validate the platform value against the Prisma enum
  const validPlatforms = Object.values(ConnectorPlatform);
  if (!validPlatforms.includes(platform as ConnectorPlatform)) {
    return res.status(400).json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` });
  }

  const token = await prisma.oAuthToken.create({
    data: {
      agencyId:             req.agencyId,
      platform:             platform as ConnectorPlatform,
      accountId:            `demo_${Date.now()}`,
      accountName,
      encryptedAccessToken: encrypt('demo_access_token'),
      scopes:               ['demo'],
      status:               TokenStatus.active,
    },
  });

  res.status(201).json({
    id: token.id, platform: token.platform, accountName: token.accountName, status: token.status,
  });
});

/** Remove a connector (revokes local token only — does not call the provider revoke endpoint). */
router.delete('/:id', async (req: Request, res: Response) => {
  const token = await prisma.oAuthToken.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!token) return res.status(404).json({ error: 'Connector not found' });

  await prisma.oAuthToken.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
