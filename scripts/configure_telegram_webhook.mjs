const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!webhookUrl || !token || !secret) {
  throw new Error('Set TELEGRAM_WEBHOOK_URL, TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET before configuring Telegram.');
}

const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  }),
});

const payload = await response.json().catch(() => ({}));
if (!response.ok || !payload.ok) {
  throw new Error(`Telegram setWebhook failed: HTTP ${response.status}`);
}

console.log(JSON.stringify({
  ok: true,
  webhook_url: webhookUrl,
  description: payload.result?.description ?? null,
}));
