import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/db';
import { encrypt, decrypt } from '../lib/encryption';

const router = Router();

function generateState(agencyId: string, platform: string): string {
  const payload = JSON.stringify({ agencyId, platform, exp: Date.now() + 10 * 60 * 1000 });
  const hmac = crypto.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'dev-secret');
  hmac.update(payload);
  return Buffer.from(payload).toString('base64') + '.' + hmac.digest('hex');
}

function verifyState(state: string): { agencyId: string; platform: string } | null {
  try {
    const [payloadB64, sig] = state.split('.');
    const payload = Buffer.from(payloadB64, 'base64').toString();
    const hmac = crypto.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'dev-secret');
    hmac.update(payload);
    const expected = hmac.digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

router.get('/', async (req: Request, res: Response) => {
  const tokens = await prisma.oAuthToken.findMany({
    where: { agencyId: req.agencyId },
    select: {
      id: true, platform: true, accountId: true, accountName: true,
      tokenExpiresAt: true, status: true, errorMessage: true,
      lastRefreshedAt: true, createdAt: true,
    },
  });
  res.json(tokens);
});

// Google OAuth
router.get('/google/auth-url', async (req: Request, res: Response) => {
  const platform = (req.query.platform as string) || 'google_analytics';
  const state = generateState(req.agencyId, platform);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.SERVER_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}/api/connectors/google/callback`;

  const scopes = platform === 'google_ads'
    ? ['https://www.googleapis.com/auth/adwords']
    : ['https://www.googleapis.com/auth/analytics.readonly'];

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

  if (!clientId) {
    return res.json({ url: null, demo: true, message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to enable.' });
  }
  res.json({ url });
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

  if (error) return res.redirect(`${frontendUrl}/connectors?error=cancelled`);

  const stateData = verifyState(state);
  if (!stateData) return res.redirect(`${frontendUrl}/connectors?error=invalid_state`);

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.SERVER_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}/api/connectors/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokens = await tokenRes.json() as any;

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json() as any;

    const platform = stateData.platform === 'google_ads' ? 'google_ads' : 'google_analytics';

    await prisma.oAuthToken.create({
      data: {
        agencyId: stateData.agencyId,
        platform,
        accountId: userInfo.sub || userInfo.email,
        accountName: userInfo.name || userInfo.email,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scopes: tokens.scope?.split(' ') || [],
        status: 'active',
      },
    });

    res.redirect(`${frontendUrl}/connectors?success=google`);
  } catch (e) {
    console.error('Google callback error:', e);
    res.redirect(`${frontendUrl}/connectors?error=oauth_failed`);
  }
});

// Meta OAuth
router.get('/meta/auth-url', async (req: Request, res: Response) => {
  const state = generateState(req.agencyId, 'meta_ads');
  const clientId = process.env.META_APP_ID;
  const redirectUri = `${process.env.SERVER_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}/api/connectors/meta/callback`;

  if (!clientId) {
    return res.json({ url: null, demo: true, message: 'Meta OAuth not configured. Add META_APP_ID to enable.' });
  }

  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read,read_insights&state=${encodeURIComponent(state)}`;
  res.json({ url });
});

router.get('/meta/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

  if (error) return res.redirect(`${frontendUrl}/connectors?error=cancelled`);

  const stateData = verifyState(state);
  if (!stateData) return res.redirect(`${frontendUrl}/connectors?error=invalid_state`);

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.SERVER_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}/api/connectors/meta/callback`;

    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
    const tokens = await tokenRes.json() as any;

    const meRes = await fetch(`https://graph.facebook.com/me?access_token=${tokens.access_token}`);
    const me = await meRes.json() as any;

    await prisma.oAuthToken.create({
      data: {
        agencyId: stateData.agencyId,
        platform: 'meta_ads',
        accountId: me.id,
        accountName: me.name || me.id,
        encryptedAccessToken: encrypt(tokens.access_token),
        tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        scopes: ['ads_read', 'read_insights'],
        status: 'active',
      },
    });

    res.redirect(`${frontendUrl}/connectors?success=meta`);
  } catch (e) {
    console.error('Meta callback error:', e);
    res.redirect(`${frontendUrl}/connectors?error=oauth_failed`);
  }
});

// LinkedIn OAuth (stub — requires MDP Standard Tier approval)
router.get('/linkedin/auth-url', async (req: Request, res: Response) => {
  return res.json({
    url: null,
    comingSoon: true,
    message: 'LinkedIn Ads connector requires MDP Standard Tier approval. Coming soon.',
  });
});

router.get('/linkedin/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return res.redirect(`${frontendUrl}/connectors?error=linkedin_not_available`);
});

// Manual token refresh
router.post('/:id/refresh', async (req: Request, res: Response) => {
  const token = await prisma.oAuthToken.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!token) return res.status(404).json({ error: 'Connector not found' });
  if (!token.encryptedRefreshToken) {
    return res.status(400).json({ error: 'No refresh token available for this connector' });
  }

  try {
    const refreshToken = decrypt(token.encryptedRefreshToken);
    let newAccessToken: string;
    let expiresIn: number;

    if (token.platform === 'google_analytics' || token.platform === 'google_ads') {
      const res2 = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const data = await res2.json() as any;
      if (data.error) throw new Error(data.error_description || data.error);
      newAccessToken = data.access_token;
      expiresIn = data.expires_in || 3600;
    } else {
      return res.status(400).json({ error: `Token refresh not supported for platform: ${token.platform}` });
    }

    const updated = await prisma.oAuthToken.update({
      where: { id: token.id },
      data: {
        encryptedAccessToken: encrypt(newAccessToken),
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        lastRefreshedAt: new Date(),
        status: 'active',
        errorMessage: null,
      },
      select: {
        id: true, platform: true, accountName: true, status: true,
        tokenExpiresAt: true, lastRefreshedAt: true,
      },
    });

    res.json(updated);
  } catch (e: any) {
    await prisma.oAuthToken.update({
      where: { id: token.id },
      data: { status: 'error', errorMessage: e.message },
    });
    res.status(500).json({ error: 'Token refresh failed', message: e.message });
  }
});

// Demo connector (for testing without real OAuth)
router.post('/demo', async (req: Request, res: Response) => {
  const { platform, accountName } = req.body;
  if (!platform || !accountName) return res.status(400).json({ error: 'platform and accountName required' });

  const token = await prisma.oAuthToken.create({
    data: {
      agencyId: req.agencyId,
      platform,
      accountId: `demo_${Date.now()}`,
      accountName,
      encryptedAccessToken: encrypt('demo_access_token'),
      scopes: ['demo'],
      status: 'active',
    },
  });
  res.status(201).json({ id: token.id, platform: token.platform, accountName: token.accountName, status: token.status });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const token = await prisma.oAuthToken.findFirst({
    where: { id: req.params.id, agencyId: req.agencyId },
  });
  if (!token) return res.status(404).json({ error: 'Connector not found' });
  await prisma.oAuthToken.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
