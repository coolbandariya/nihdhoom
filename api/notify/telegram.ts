import { rateLimit } from '../_lib/rateLimit.js';
declare const process: { env: Record<string, string | undefined> };

async function verifyDispatcher(req: any) {
  const authorization = String(req.headers?.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || !(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)) return false;
  try {
    const userResponse = await fetch(`${(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)}/auth/v1/user`, {
      headers: { apikey: (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY), Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!userResponse.ok) return false;
    const user = await userResponse.json();
    const profileResponse = await fetch(
      `${(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      { headers: { apikey: (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY), Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!profileResponse.ok) return false;
    const profiles = await profileResponse.json();
    return ['dispatcher', 'admin'].includes(profiles?.[0]?.role);
  } catch { return false; }
}

function validChatId(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value)
    ? true
    : typeof value === 'string' && /^-?\d{1,20}$/.test(value);
}

export default async function handler(req: any, res: any) {
  if (!rateLimit(req, res, 'api-telegram.ts', 20)) return res.status(429).json({ error: 'Too many Telegram requests; please retry shortly.' });

  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await verifyDispatcher(req))) return res.status(401).json({ error: 'Authenticated dispatcher/admin required' });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return res.status(503).json({ error: 'Telegram bot credentials are not configured' });

  const { chat_id, text, disable_web_page_preview } = req.body || {};
  if (!validChatId(chat_id) || typeof text !== 'string' || !text.trim() || text.length > 4096) {
    return res.status(400).json({ error: 'A valid Telegram chat_id and message (1–4096 characters) are required' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: text.trim(), disable_web_page_preview: Boolean(disable_web_page_preview) }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.ok && data.ok ? 200 : 502).json(
      response.ok && data.ok
        ? { ok: true, message_id: data.result?.message_id || null }
        : { error: data.description || 'Telegram send failed' },
    );
  } catch {
    return res.status(502).json({ error: 'Telegram provider unavailable' });
  }
}
