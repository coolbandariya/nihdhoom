import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Layers3, Plus, Users } from 'lucide-react';
import { Field } from '../../types';
import { supabase } from '../../lib/supabase';

type Pool = { id: string; name: string; target_tonnes: number; current_tonnes: number; status: string; buyer_demand_id?: string | null };
type Demand = { id: string; buyer_name: string; target_tonnes: number; pickup_deadline: string; radius_km: number; status: string };

interface Props { fields: Field[]; demoMode: boolean; }

export function ResiduePooling({ fields, demoMode }: Props) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [notice, setNotice] = useState('');

  const localSupply = useMemo(() => fields.map(f => ({
    fieldId: f.id,
    farmer: f.farmer_name,
    village: f.village,
    tonnes: Number(f.acreage || 0) * 1.8,
    status: f.status,
  })), [fields]);

  async function load() {
    if (demoMode || !supabase) return;
    const db = supabase as any;
    const [p, d] = await Promise.all([
      db.from('residue_pools').select('id,name,target_tonnes,current_tonnes,status,buyer_demand_id').order('created_at', { ascending: false }),
      db.from('buyer_demands').select('id,buyer_name,target_tonnes,pickup_deadline,radius_km,status').eq('status','OPEN').order('created_at', { ascending: false }),
    ]);
    if (!p.error) setPools(p.data || []);
    if (!d.error) setDemands(d.data || []);
  }

  useEffect(() => { void load(); }, [demoMode]);

  function createDemoPool() {
    const total = localSupply.slice(0, 3).reduce((s, x) => s + x.tonnes, 0);
    setPools(prev => [{ id: `demo-${Date.now()}`, name: 'Demo procurement pool', target_tonnes: Math.max(20, total), current_tonnes: total, status: 'FILLING' }, ...prev]);
    setNotice('Demo pool created. Live mode uses the Supabase pooling workflow.');
  }

  async function joinPool(poolId: string, tonnes: number) {
    if (demoMode || !supabase) { setNotice('Demo mode: pool membership simulated locally.'); return; }
    const { error } = await (supabase as any).rpc('join_residue_pool', { p_pool_id: poolId, p_quantity_tonnes: tonnes });
    setNotice(error ? error.message : 'Residue committed to the pool.');
    if (!error) await load();
  }

  const visiblePools = demoMode && pools.length === 0
    ? [{ id: 'demo-1', name: 'Ludhiana buyer aggregation', target_tonnes: 80, current_tonnes: Math.min(80, localSupply.reduce((s, x) => s + x.tonnes, 0)), status: 'FILLING' }]
    : pools;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div><div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest"><Layers3 className="h-4 w-4" /> Residue-first marketplace</div><h1 className="mt-1 text-2xl font-black text-white">Residue Supply & Deal Pools</h1><p className="text-sm text-slate-400 mt-1">Pool fragmented, verified residue against buyer requirements before discussing impact or carbon value.</p></div>
          {demoMode && <button onClick={createDemoPool} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Plus className="inline h-3.5 w-3.5 mr-1" /> Create demo pool</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="font-bold text-white">Verified / available supply</h2>
          <div className="mt-3 space-y-2">
            {localSupply.length === 0 ? <p className="text-sm text-slate-500">No field supply records yet.</p> : localSupply.map(s => (
              <div key={s.fieldId} className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
                <div><div className="text-xs font-bold text-white">{s.farmer}</div><div className="text-[10px] text-slate-500">{s.village} · {s.status}</div></div>
                <div className="text-sm font-black text-emerald-300">{s.tonnes.toFixed(1)} t est.</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/20 bg-slate-950/60 p-4">
          <h2 className="font-bold text-white">Buyer demand</h2>
          <div className="mt-3 space-y-2">
            {demands.length === 0 ? <p className="text-sm text-slate-500">No live buyer demand published yet.</p> : demands.map(d => (
              <div key={d.id} className="rounded-lg border border-slate-800 p-3">
                <div className="flex justify-between"><span className="text-xs font-bold text-white">{d.buyer_name}</span><span className="text-xs text-amber-300">{d.target_tonnes} t</span></div>
                <div className="mt-1 text-[10px] text-slate-500">Pickup by {d.pickup_deadline} · radius {d.radius_km} km</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-300" /><h2 className="font-bold text-white">Deal pools</h2></div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {visiblePools.map(p => {
            const pct = Math.min(100, Math.round((p.current_tonnes / Math.max(1, p.target_tonnes)) * 100));
            return <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex justify-between"><span className="text-sm font-bold text-white">{p.name}</span><span className="text-[10px] text-cyan-300">{p.status}</span></div>
              <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
              <div className="mt-2 flex justify-between text-xs text-slate-400"><span>{p.current_tonnes.toFixed(1)} t pooled</span><span>{p.target_tonnes.toFixed(1)} t target</span></div>
              <button onClick={() => void joinPool(p.id, Math.min(5, Math.max(1, p.target_tonnes - p.current_tonnes)))} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200"><CheckCircle2 className="h-3.5 w-3.5" /> Join pool</button>
            </div>;
          })}
        </div>
      </section>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">{notice}</div>}
      <div className="flex items-center gap-2 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Pooling locks only after quantity, quality, pickup window and buyer match are validated.</div>
    </div>
  );
}
