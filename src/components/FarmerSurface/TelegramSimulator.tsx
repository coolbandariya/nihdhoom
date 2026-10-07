import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { HindiTextConverter } from './HindiTextConverter';
import { Bell, CalendarCheck, Camera, CheckCircle2, MapPin, Send, ShieldCheck } from 'lucide-react';

interface TelegramSimulatorProps {
  onSlotConfirmed?: (fieldId: string) => void;
}

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

export function TelegramSimulator({ onSlotConfirmed }: TelegramSimulatorProps) {
  const [language, setLanguage] = useState<'pa' | 'hi' | 'en'>('pa');
  const [confirmed, setConfirmed] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [botReady, setBotReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/notify/telegram-webhook', { method: 'GET' })
      .then((res) => res.ok)
      .then((ok) => { if (active) setBotReady(ok); })
      .catch(() => { if (active) setBotReady(false); });
    return () => { active = false; };
  }, []);

  const botUrl = useMemo(() => BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me', []);

  const copy = {
    pa: {
      title: 'NIRDHOOM Telegram',
      subtitle: 'ਕਿਸਾਨ ਲਈ ਸੌਖਾ ਸੰਚਾਰ — ਬੁਕਿੰਗ, ਮਸ਼ੀਨ ਅਤੇ ਸਬੂਤ ਇੱਕੋ ਥਾਂ',
      welcome: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ NIRDHOOM Sathi ਹਾਂ। ਤੁਹਾਡੇ ਖੇਤ ਦੀ clearance booking ਅਤੇ status ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।',
      cta: 'Telegram ਵਿੱਚ NIRDHOOM ਖੋਲ੍ਹੋ',
      slot: 'Clearance slot',
      slotValue: 'ਅਗਲਾ ਉਪਲਬਧ slot — ਪੁਸ਼ਟੀ ਤੋਂ ਪਹਿਲਾਂ live capacity ਚੈੱਕ ਹੋਵੇਗੀ',
      evidence: 'Field evidence',
      evidenceValue: 'Operator Telegram ਤੋਂ photo/evidence workflow ਖੋਲ੍ਹ ਸਕਦਾ ਹੈ',
      alerts: 'Status alerts',
      alertsValue: 'Booking, operator assignment ਅਤੇ verification updates',
      note: 'Live capacity, GPS ਅਤੇ verification ਸਿਰਫ਼ authenticated backend records ਤੋਂ ਦਿਖਾਏ ਜਾਣਗੇ।',
    },
    hi: {
      title: 'NIRDHOOM Telegram',
      subtitle: 'किसान के लिए आसान संचार — बुकिंग, मशीन और सबूत एक जगह',
      welcome: 'नमस्ते! मैं NIRDHOOM Sathi हूँ। मैं आपके खेत की clearance booking और status में मदद कर सकता हूँ।',
      cta: 'Telegram में NIRDHOOM खोलें',
      slot: 'Clearance slot',
      slotValue: 'अगला उपलब्ध slot — पुष्टि से पहले live capacity जाँची जाएगी',
      evidence: 'Field evidence',
      evidenceValue: 'Operator Telegram से photo/evidence workflow खोल सकता है',
      alerts: 'Status alerts',
      alertsValue: 'Booking, operator assignment और verification updates',
      note: 'Live capacity, GPS और verification केवल authenticated backend records से दिखेंगे।',
    },
    en: {
      title: 'NIRDHOOM Telegram',
      subtitle: 'One farmer channel for booking, machine status and evidence',
      welcome: 'Hello! I am NIRDHOOM Sathi. I can help with clearance booking and field status.',
      cta: 'Open NIRDHOOM on Telegram',
      slot: 'Clearance slot',
      slotValue: 'Next available slot — live capacity is checked before confirmation',
      evidence: 'Field evidence',
      evidenceValue: 'Operators can open the photo/evidence workflow from Telegram',
      alerts: 'Status alerts',
      alertsValue: 'Booking, operator assignment and verification updates',
      note: 'Live capacity, GPS and verification are shown only from authenticated backend records.',
    },
  }[language];

  const connectTelegram = async () => {
    setLinking(true);
    setLinkError('');
    try {
      const sessionResult = await supabase?.auth.getSession();
      const accessToken = sessionResult?.data?.session?.access_token;
      if (!accessToken) {
        setLinkError('Sign in to NIRDHOOM first, then generate a secure Telegram link.');
        return;
      }
      const response = await fetch('/api/notify/telegram-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.bot_url) {
        setLinkError(payload.error || 'Unable to generate a secure Telegram link.');
        return;
      }
      window.open(payload.bot_url, '_blank', 'noopener,noreferrer');
    } catch {
      setLinkError('Telegram linking service is temporarily unavailable.');
    } finally {
      setLinking(false);
    }
  };

  const confirmDemo = () => {
    setConfirmed(true);
    onSlotConfirmed?.('demo-field-1');
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-50" aria-hidden="true" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <Send className="h-3.5 w-3.5" /> TELEGRAM-FIRST FARMER CHANNEL
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${botReady === true ? 'bg-emerald-100 text-emerald-800' : botReady === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${botReady === true ? 'bg-emerald-500' : botReady === false ? 'bg-red-500' : 'bg-slate-400'}`} />
                {botReady === true ? 'BOT ONLINE' : botReady === false ? 'BOT UNAVAILABLE' : 'CHECKING BOT'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{copy.title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 sm:text-base">{copy.subtitle}</p>
            <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-white/80 p-4 text-sm leading-6 text-slate-700">
              <span className="font-bold text-slate-950">Sathi:</span> {copy.welcome}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <a
              href={botUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <Send className="h-4 w-4" /> {copy.cta}
            </a>
            <button
              type="button"
              onClick={connectTelegram}
              disabled={linking}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" /> {linking ? 'Creating secure link…' : 'Connect my NIRDHOOM account'}
            </button>
            {linkError && <p role="alert" className="text-center text-xs font-semibold text-red-700">{linkError}</p>}
            <div className="text-center text-[11px] font-semibold text-slate-500">
              @{BOT_USERNAME}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2 sm:grid-cols-4">
            {['Open Telegram', 'Securely link account', 'Book / track', 'Receive updates'].map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-700 text-xs font-black text-white">{index + 1}</span>
                <span className="text-xs font-bold text-slate-800">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['pa', 'ਪੰਜਾਬੀ'],
            ['hi', 'हिन्दी'],
            ['en', 'English'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setLanguage(id as 'pa' | 'hi' | 'en')}
              className={`min-h-10 rounded-xl border px-3 text-sm font-bold transition ${language === id ? 'border-emerald-600 bg-emerald-700 text-white' : 'border-emerald-900/10 bg-white text-emerald-950 hover:bg-emerald-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { icon: CalendarCheck, title: copy.slot, value: copy.slotValue },
          { icon: Camera, title: copy.evidence, value: copy.evidenceValue },
          { icon: Bell, title: copy.alerts, value: copy.alertsValue },
        ].map(({ icon: Icon, title, value }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Icon className="h-5 w-5 text-amber-600" />
            <h3 className="mt-3 text-base font-extrabold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm font-medium leading-6 text-amber-950">{copy.note}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-extrabold">Telegram → NIRDHOOM workflow</h3>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {['Farmer starts bot', 'Link field / consent', 'Book + track', 'Evidence + verification'].map((step, index) => (
            <div key={step} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-black text-amber-300">0{index + 1}</div>
              <div className="mt-1 text-sm font-bold text-slate-800">{step}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={confirmDemo}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800"
        >
          {confirmed ? <CheckCircle2 className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />}
          {confirmed ? 'Demo slot confirmed' : 'Preview booking handoff'}
        </button>
      </div>

      <HindiTextConverter />
    </section>
  );
}
