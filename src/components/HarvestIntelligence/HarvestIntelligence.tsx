import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Factory, Gauge, MapPinned, ShieldCheck, Sparkles, Truck, Wheat } from 'lucide-react';
import { Field, Machine } from '../../types';
import { supabase } from '../../lib/supabase';

interface Props {
  fields: Field[];
  machines: Machine[];
  demoMode: boolean;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function HarvestIntelligence({ fields, machines, demoMode }: Props) {
  const harvestDates = useMemo(
    () => fields.map(f => toDate(f.expected_harvest_date)).filter((d): d is Date => Boolean(d)),
    [fields],
  );

  const start = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return harvestDates.length ? new Date(Math.min(today.getTime(), ...harvestDates.map(d => d.getTime()))) : today;
  }, [harvestDates]);

  const [offset, setOffset] = useState(7);
  const [weather, setWeather] = useState<{ precipitationProbability: number; precipitationMm: number; windGustKmh: number; fetchedAt: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const selectedDate = new Date(start);
  selectedDate.setDate(selectedDate.getDate() + offset);

  const selectedWeatherField = fields[0];

  useEffect(() => {
    if (demoMode || !selectedWeatherField) {
      setWeather(null);
      setWeatherError(null);
      return;
    }

    let active = true;
    const loadWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      const db = supabase;
      if (!db) {
        if (active) setWeatherError('Live weather is not configured.');
        setWeatherLoading(false);
        return;
      }
      const { data } = await db.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (active) setWeatherError('Sign in to load field weather.');
        setWeatherLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/weather?field_id=${encodeURIComponent(selectedWeatherField.dbId || selectedWeatherField.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Weather provider unavailable');
        const hourly = payload?.forecast?.hourly || {};
        const probabilities = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability.slice(0, 24) : [];
        const precipitation = Array.isArray(hourly.precipitation) ? hourly.precipitation.slice(0, 24) : [];
        const gusts = Array.isArray(hourly.wind_gusts_10m) ? hourly.wind_gusts_10m.slice(0, 24) : [];
        if (!active) return;
        setWeather({
          precipitationProbability: probabilities.length ? Math.max(...probabilities.map(Number).filter(Number.isFinite)) : 0,
          precipitationMm: precipitation.length ? precipitation.reduce((sum: number, value: number) => sum + (Number(value) || 0), 0) : 0,
          windGustKmh: gusts.length ? Math.max(...gusts.map(Number).filter(Number.isFinite)) : 0,
          fetchedAt: String(payload?.fetched_at || new Date().toISOString()),
        });
      } catch (error) {
        if (active) setWeatherError(error instanceof Error ? error.message : 'Weather provider unavailable');
      } finally {
        if (active) setWeatherLoading(false);
      }
    };

    void loadWeather();
    return () => { active = false; };
  }, [demoMode, selectedWeatherField?.id]);

  const horizon = useMemo(() => {
    const end = new Date(start);
    end.setDate(end.getDate() + 35);
    return end;
  }, [start]);

  const upcoming = useMemo(() => {
    const selected = selectedDate.getTime();
    const windowEnd = selected + 72 * 60 * 60 * 1000;
    return fields.filter(f => {
      const d = toDate(f.expected_harvest_date);
      return d && d.getTime() >= selected - 24 * 60 * 60 * 1000 && d.getTime() <= windowEnd;
    });
  }, [fields, selectedDate]);

  const acres = upcoming.reduce((s, f) => s + (Number(f.acreage) || 0), 0);
  const activeMachines = machines.filter(m => m.status !== 'MAINTENANCE');
  const dailyCapacity = activeMachines.reduce((s, m) => s + (Number(m.capacity_acres_day) || 0), 0);
  const utilization = dailyCapacity ? Math.min(100, Math.round((acres / dailyCapacity) * 100)) : 0;
  const recommended = dailyCapacity
    ? Math.max(0, Math.ceil(acres / Math.max(1, dailyCapacity / Math.max(1, activeMachines.length))))
    : 0;

  const blocks = useMemo(() => {
    const grouped = new Map<string, { acres: number; fields: number; varieties: Set<string> }>();
    upcoming.forEach(f => {
      const key = f.block || f.village || 'Unassigned area';
      const current = grouped.get(key) || { acres: 0, fields: 0, varieties: new Set<string>() };
      current.acres += Number(f.acreage) || 0;
      current.fields += 1;
      if (f.paddy_variety) current.varieties.add(f.paddy_variety);
      grouped.set(key, current);
    });
    return [...grouped.entries()].sort((a, b) => b[1].acres - a[1].acres);
  }, [upcoming]);

  const dateLabel = selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const horizonLabel = horizon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const weatherSignal = weather
    ? weather.precipitationProbability >= 70 || weather.precipitationMm >= 8
      ? { label: 'Weather caution', detail: 'Rain risk is high enough to review the pickup window before dispatch.', tone: 'caution' }
      : weather.windGustKmh >= 35
        ? { label: 'Wind caution', detail: 'Gusts are elevated; confirm operator conditions before committing a route.', tone: 'caution' }
        : { label: 'Weather looks workable', detail: 'No high-risk signal from this planning heuristic. Confirm field and machine readiness separately.', tone: 'good' }
    : null;

  return (
    <div className="tone-adapt harvest-intelligence-surface ui-stack">
      <section className="ui-intro">
        <>
          <div className="ui-intro-copy">
            <div className="ui-eyebrow">
              <Wheat className="h-4 w-4" /> Harvest intelligence
            </div>
            <h1 className="ui-title">Predict the pressure. Position the fleet.</h1>
            <p className="ui-lede">
              Inspired by the reference harvest-forecast workflow, this version derives demand from NIRDHOOM field records instead of hard-coded district claims.
            </p>
          </div>
          <div className="ui-chip is-wheat">
            {demoMode ? 'Planning model • synthetic fields' : 'Planning model • live field records'}
          </div>
        </>
      </section>

      <section className="ui-card is-green">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--surface)] text-[var(--brand)] shadow-sm"><CalendarDays className="h-5 w-5" /></span>
            <div>
              <div className="ui-kv-label">Planning horizon</div>
              <div className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-tight text-[var(--ink)]">{dateLabel}</div>
            </div>
          </div>
          <div className="ui-chip">
            72-hour harvest pressure window · through <span className="text-[var(--brand-ink)]">{horizonLabel}</span>
          </div>
        </div>

        <input
          aria-label="Harvest planning date"
          type="range"
          min="0"
          max="35"
          value={offset}
          onChange={e => setOffset(Number(e.target.value))}
          className="ui-range mt-5 cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[12px] text-[var(--muted)]">
          <span>{start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span>+18 days</span>
          <span>+35 days</span>
        </div>
      </section>

      <section className="ui-card">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="max-w-3xl">
            <div className="ui-eyebrow is-sky">
              <ShieldCheck className="h-4 w-4" /> Weather-aware operations
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--ink)]">Should the fleet move this window?</h2>
            <p className="ui-card-sub">
              Live mode reads Open-Meteo through the authenticated weather adapter for the selected field. It informs planning; it does not guarantee machine access or harvest conditions.
            </p>
          </div>
          <div className="ui-chip shrink-0">
            {demoMode ? 'No synthetic weather score' : weatherLoading ? 'Fetching live forecast…' : weather ? `Fetched ${new Date(weather.fetchedAt).toLocaleString('en-IN')}` : 'No forecast'}
          </div>
        </div>
        {weatherError ? (
          <div className="ui-note is-wheat mt-4">{weatherError}</div>
        ) : weather ? (
          <>
          <div className="ui-stats mt-4">
            <div className="ui-stat is-sky">
              <div className="ui-stat-label">Max rain probability</div>
              <div className="ui-stat-value">{weather.precipitationProbability}%</div>
            </div>
            <div className="ui-stat is-sky">
              <div className="ui-stat-label">24h precipitation</div>
              <div className="ui-stat-value">{weather.precipitationMm.toFixed(1)} mm</div>
            </div>
            <div className="ui-stat is-sky">
              <div className="ui-stat-label">Max wind gust</div>
              <div className="ui-stat-value">{weather.windGustKmh.toFixed(0)} km/h</div>
            </div>
          </div>
          {weatherSignal && (
            <div className={`ui-note mt-3 flex-col !gap-1 ${weatherSignal.tone === 'caution' ? 'is-wheat' : 'is-green'}`}>
              <div className="text-xs font-extrabold">{weatherSignal.label}</div>
              <div className="mt-1 text-xs leading-5">{weatherSignal.detail}</div>
              <div className="mt-1 text-[10px] opacity-70">Planning heuristic based on the authenticated forecast response; not a machine-safety guarantee.</div>
            </div>
          )}
          </>
        ) : (
          <div className="ui-empty mt-4 !py-6">
            {demoMode ? 'Weather is intentionally not fabricated in demo mode.' : 'Select a field with valid coordinates to load the live forecast.'}
          </div>
        )}
      </section>

      <section className="ui-stats">
        {[
          ['Harvest-window fields', upcoming.length, MapPinned],
          ['Acres in 72h', acres.toFixed(1), Wheat],
          ['Available balers', activeMachines.length, Factory],
          ['Daily capacity', dailyCapacity.toFixed(1) + ' ac', Gauge],
          ['Capacity pressure', utilization + '%', Truck],
        ].map(([label, value, Icon]: any) => (
          <div key={String(label)} className="ui-stat is-green">
            <Icon className="mb-1 h-[18px] w-[18px] text-[var(--brand)]" />
            <div className="ui-stat-value">{value}</div>
            <div className="ui-stat-label">{label}</div>
          </div>
        ))}
      </section>

      <section className="ui-split">
        <div className="ui-card">
          <div className="ui-card-head !mb-0">
            <div>
              <h2 className="ui-card-title">Block-level harvest pressure</h2>
              <p className="ui-card-sub">Grouped from fields entering the selected 72-hour window.</p>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--wheat)]" />
          </div>

          <div className="mt-4 space-y-2">
            {blocks.length === 0 ? (
              <div className="ui-empty">
                No field harvest records fall inside this window.
              </div>
            ) : blocks.map(([name, data]) => {
              const share = acres ? Math.round((data.acres / acres) * 100) : 0;
              return (
                <div key={name} className="ui-kv !p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14.5px] font-bold text-[var(--ink)]">{name}</div>
                      <div className="text-[12px] text-[var(--muted)]">{data.fields} field(s) · {[...data.varieties].join(', ') || 'Variety not recorded'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-display)] text-[18px] font-bold text-[var(--brand-ink)]">{data.acres.toFixed(1)} ac</div>
                      <div className="text-[12px] text-[var(--muted)]">{share}% of window</div>
                    </div>
                  </div>
                  <div className="ui-progress mt-3">
                    <div style={{ width: Math.min(100, share) + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ui-card is-wheat">
          <div className="ui-card-title">
            <Truck className="!text-[var(--wheat-ink)]" />
            <h2>Fleet pre-positioning</h2>
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--wheat-line)] bg-[var(--surface)] p-4">
            <div className="ui-kv-label">Recommended active machines</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-[44px] font-bold leading-none text-[var(--ink)]">{recommended || '—'}</div>
            <div className="mt-2 text-[13px] text-[var(--muted)]">
              {utilization > 100 ? 'Capacity shortfall detected — escalate to dispatch.' : utilization > 80 ? 'High pressure — pre-position before the window opens.' : 'Capacity currently appears sufficient.'}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="ui-note">
              <ShieldCheck />
              <span>Use verified fields as the dispatch priority signal.</span>
            </div>
            <div className="ui-note">
              <Gauge />
              <span>Recalculate after machine status or harvest dates change.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
