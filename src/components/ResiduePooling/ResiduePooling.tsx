import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Layers3, Plus, Users, Leaf as LeafIcon } from 'lucide-react';
import { Field } from '../../types';
import { supabase } from '../../lib/supabase';

type Pool = { id: string; name: string; target_tonnes: number; current_tonnes: number; status: string; buyer_demand_id?: string | null };
type Demand = { id: string; buyer_name: string; target_tonnes: number; pickup_deadline: string; radius_km: number; status: string };

interface Props { fields: Field[]; demoMode: boolean; }

export function ResiduePooling({ fields, demoMode }: Props) {
  const [pools, setPools] = useState<Pool[]>(() => {
    if (!demoMode || typeof window === 'undefined') return [];
    try { const raw = window.localStorage.getItem('nirdhoom.demo.pools.v1'); return raw ? (JSON.parse(raw) as Pool[]) : []; } catch { return []; }
  });
  const [demands, setDemands] = useState<Demand[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!demoMode || typeof window === 'undefined') return;
    try { window.localStorage.setItem('nirdhoom.demo.pools.v1', JSON.stringify(pools)); } catch { /* optional demo persistence */ }
  }, [demoMode, pools]);

  const localSupply = useMemo(() => fields.filter((f) => demoMode || f.status === 'VERIFIED_NON_BURN' || f.is_verified_non_burn).map(f => ({
    fieldId: f.id,
    farmer: f.farmer_name,
    village: f.village,
    tonnes: Number(f.acreage || 0) * 1.8, // illustrative planning coefficient
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

  async function createPoolFromDemand(demand: Demand) {
    if (demoMode || !supabase) { setNotice('Demo mode: buyer-demand pool creation is simulated.'); return; }
    const { data, error } = await (supabase as any).rpc('create_residue_pool', {
      p_name: `${demand.buyer_name} · ${demand.target_tonnes}t procurement pool`,
      p_target_tonnes: demand.target_tonnes,
      p_pickup_deadline: demand.pickup_deadline,
      p_buyer_demand_id: demand.id,
    });
    setNotice(error ? error.message : `Pool ${data?.id || ''} created from buyer demand.`);
    if (!error) await load();
  }

  async function joinPool(poolId: string, tonnes: number) {
    if (demoMode || !supabase) {
      setPools(prev => prev.map(p => p.id === poolId ? { ...p, current_tonnes: Math.min(p.target_tonnes, p.current_tonnes + tonnes), status: Math.min(p.target_tonnes, p.current_tonnes + tonnes) >= p.target_tonnes ? 'READY' : 'FILLING' } : p));
      setNotice(`Demo: committed ${tonnes.toFixed(1)} t to the pool. No sale or payment was executed.`);
      return;
    }
    const { error } = await (supabase as any).rpc('join_residue_pool', { p_pool_id: poolId, p_quantity_tonnes: tonnes });
    setNotice(error ? error.message : 'Residue committed to the pool.');
    if (!error) await load();
  }

  const visiblePools = demoMode && pools.length === 0
    ? [{ id: 'demo-1', name: 'Ludhiana buyer aggregation', target_tonnes: 80, current_tonnes: Math.min(80, localSupply.reduce((s, x) => s + x.tonnes, 0)), status: 'FILLING' }]
    : pools;

  return (
    <div className="farmer-surface farmer-market residue-pooling-surface space-y-5">
      <section className="market-hero-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div><div className="market-eyebrow"><Layers3 className="h-4 w-4" /> Residue-first marketplace</div><h1>Pool verified residue for offtake</h1><p>Pool fragmented, verified residue against buyer requirements before discussing impact or carbon value.</p></div>
          {demoMode && <button onClick={createDemoPool} className="market-primary-action"><Plus className="h-3.5 w-3.5" /> Create demo pool</button>}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="market-card">
          <div className="market-card-heading"><div><span className="market-card-kicker">FIELD</span><h2>Field-derived supply</h2></div><span className="market-count">{localSupply.length} lots</span></div>
          <div className="mt-3 space-y-2">
            {localSupply.length === 0 ? <div className="market-empty"><LeafIcon className="market-empty-icon" /><strong>No verified field supply yet</strong><p>Verified field lots will appear here when they are ready for pooling.</p></div> : localSupply.map(s => (
              <div key={s.fieldId} className="market-list-row">
                <div><div className="market-row-title">{s.farmer}</div><div className="market-row-meta">{s.village} · {s.status}</div></div>
                <div className="market-tonnage">{s.tonnes.toFixed(1)} t planning</div>
              </div>
            ))}
          </div>
        </section>

        <section className="market-card market-card-demand">
          <div className="market-card-heading"><div><span className="market-card-kicker">BUYER</span><h2>Buyer demand</h2></div><span className="market-count">{demands.length} open</span></div>
          <div className="mt-3 space-y-2">
            {demands.length === 0 ? <div className="market-empty"><Users className="market-empty-icon" /><strong>No buyer demand published yet</strong><p>Open buyer requirements will appear here with quantity, pickup window and radius.</p></div> : demands.map(d => (
              <div key={d.id} className="market-demand-row">
                <div className="flex justify-between"><span className="market-row-title">{d.buyer_name}</span><span className="market-tonnage">{d.target_tonnes} t</span></div>
                <div className="market-row-meta">Pickup by {d.pickup_deadline} · radius {d.radius_km} km</div>
                <button onClick={() => void createPoolFromDemand(d)} className="market-secondary-action"><ArrowRight className="h-3 w-3" /> Create pool</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="market-card market-card-pools">
        <div className="market-card-heading"><div><span className="market-card-kicker">POOL</span><h2>Residue Supply & Deal Pools</h2></div><span className="market-count">{visiblePools.length} pools</span></div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {visiblePools.map(p => {
            const pct = Math.min(100, Math.round((p.current_tonnes / Math.max(1, p.target_tonnes)) * 100));
            return <div key={p.id} className="market-pool-card">
              <div className="flex justify-between"><span className="market-row-title">{p.name}</span><span className="market-status">{p.status}</span></div>
              <div className="market-progress"><div style={{ width: `${pct}%` }} /></div>
              <div className="market-progress-meta"><span>{p.current_tonnes.toFixed(1)} t pooled</span><span>{p.target_tonnes.toFixed(1)} t target</span></div>
              <button onClick={() => void joinPool(p.id, Math.min(5, Math.max(1, p.target_tonnes - p.current_tonnes)))} className="market-secondary-action market-full-action"><CheckCircle2 className="h-3.5 w-3.5" /> Join pool</button>
            </div>;
          })}
        </div>
      </section>

      {notice && <div className="market-notice">{notice}</div>}
      <div className="market-footnote"><Clock3 className="h-3.5 w-3.5" /> Pooling locks only after quantity, quality, pickup window and buyer match are validated.</div>
    </div>
  );
}
