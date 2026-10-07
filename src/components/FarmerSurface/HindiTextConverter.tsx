import { useState } from 'react';
import { ArrowRightLeft, Copy, Languages, Loader2, RotateCcw, Check } from 'lucide-react';

type Direction = 'toHindi' | 'toRoman';

async function convertHindiText(text: string, direction: Direction): Promise<string> {
  const value = text.trim();
  if (!value) return '';

  const params = new URLSearchParams({
    text: value,
    itc: direction === 'toHindi' ? 'hi-t-i0-und' : 'en-t-i0-und',
    num: '5',
    cp: '0',
    cs: '1',
    ie: 'utf-8',
    oe: 'utf-8',
    app: 'nirdhoom',
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`https://inputtools.google.com/request?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Converter service unavailable');
    const payload = await response.json();
    const candidate = payload?.[0] === 'SUCCESS' ? payload?.[1]?.[0]?.[1]?.[0] : null;
    if (typeof candidate !== 'string' || !candidate.trim()) throw new Error('No conversion candidate');
    return candidate;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function HindiTextConverter() {
  const [direction, setDirection] = useState<Direction>('toHindi');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = async () => {
    if (!input.trim()) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      setOutput(await convertHindiText(input, direction));
    } catch {
      setError('Online Hindi conversion is temporarily unavailable. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const swap = () => {
    setDirection((value) => value === 'toHindi' ? 'toRoman' : 'toHindi');
    setInput(output);
    setOutput('');
    setError('');
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError('Clipboard access was blocked by the browser.');
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-950/70 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Languages className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">Hindi text converter</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Roman Hindi ↔ हिन्दी for farmer messages</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDirection((value) => value === 'toHindi' ? 'toRoman' : 'toHindi')}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 text-xs font-black text-amber-800 hover:bg-amber-100"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          {direction === 'toHindi' ? 'Roman → हिन्दी' : 'हिन्दी → Roman'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={direction === 'toHindi' ? 'Type: namaste ji, meri booking kab hai?' : 'Type: नमस्ते जी, मेरी बुकिंग कब है?'}
          className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-amber-900/30"
          aria-label="Hindi converter input"
        />
        <div className="flex justify-center gap-2 lg:flex-col">
          <button
            type="button"
            onClick={convert}
            disabled={!input.trim() || busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-black text-slate-950 shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
            Convert
          </button>
          <button
            type="button"
            onClick={swap}
            disabled={!output}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="Use the result as the next input"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Swap
          </button>
        </div>
        <div className="relative min-h-28 rounded-2xl border border-emerald-300 bg-[#F0FDF4] p-3 shadow-sm">
          <div className="min-h-[5.5rem] whitespace-pre-wrap break-words font-sans text-sm font-semibold leading-6 text-[#0F172A]">
            {output || <span className="text-slate-500">Converted text appears here…</span>}
          </div>
          {output && (
            <button type="button" onClick={copyOutput} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-emerald-800 hover:bg-white dark:bg-slate-900/70 dark:text-emerald-300" aria-label="Copy converted text">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      <p className="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
        Uses Google Input Tools transliteration for phonetic conversion; it is transliteration, not meaning-based translation.
      </p>
    </section>
  );
}
