/// <reference types="node" />
import { createHmac, createHash } from 'node:crypto';
import { rateLimit } from '../_lib/rateLimit.js';

declare const process: { env: Record<string, string | undefined> };

function verifyInitData(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !initData || initData.length > 8192) return null;

  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  const authDate = Number(params.get('auth_date'));
  if (!receivedHash || !Number.isSafeInteger(authDate)) return null;

  const maxAge = 10 * 60;
  if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > maxAge) return null;

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (calculated.length !== receivedHash.length) return null;

  const expected = Buffer.from(calculated, 'hex');
  const received = Buffer.from(receivedHash, 'hex');
  if (expected.length !== received.length) return null;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected[i] ^ received[i];
  if (mismatch !== 0) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    if (!Number.isSafeInteger(Number(user.id))) return null;
    return { telegram_user_id: Number(user.id), user };
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!rateLimit(req, res, 'telegram-miniapp-auth', 30, 60_000)) return res.status(429).json({ error: 'Too many authentication requests' });
  const initData = String(req.body?.initData || '');
  const verified = verifyInitData(initData);
  if (!verified) return res.status(401).json({ error: 'Invalid or expired Telegram Mini App identity' });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = ((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL);
  if (!serviceKey || !supabaseUrl) return res.status(503).json({ error: 'Server identity service is not configured' });

  const response = await fetch(
    `${supabaseUrl}/rest/v1/telegram_identities?telegram_user_id=eq.${verified.telegram_user_id}&select=profile_id,notification_enabled&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) return res.status(502).json({ error: 'Unable to resolve Telegram identity' });

  const rows = await response.json();
  const identity = rows?.[0];
  if (!identity) {
    return res.status(403).json({ error: 'Telegram account is not linked to a NIRDHOOM profile' });
  }

  // Refresh activity server-side after Telegram identity has been authenticated.
  await fetch(
    supabaseUrl + '/rest/v1/telegram_identities?telegram_user_id=eq.' + verified.telegram_user_id,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(7000),
    },
  ).catch(() => {});

  return res.status(200).json({
    ok: true,
    profile_id: identity.profile_id,
    notification_enabled: identity.notification_enabled,
  });
}
