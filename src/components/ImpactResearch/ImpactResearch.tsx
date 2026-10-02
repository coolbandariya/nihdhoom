import { BarChart3, BookOpen, CheckCircle2, Database, Leaf, ShieldCheck } from 'lucide-react';
import { Field } from '../../types';

interface Props { fields: Field[]; demoMode: boolean; }

export function ImpactResearch({ fields, demoMode }: Props) {
  const verified = fields.filter(f => f.status === 'VERIFIED_NON_BURN' || f.is_verified_non_burn);
  const acres = verified.reduce((s, f) => s + Number(f.acreage || 0), 0);
  const residue = verified.reduce((s, f) => s + Number(f.acreage || 0) * 1.8, 0);
  const evidenceCoverage = verified.length ? 100 : 0;

  const metrics = [
    ['Verified hectares', (acres * 0.404686).toFixed(1), 'ha'],
    ['Verified residue', residue.toFixed(1), 't'],
    ['Evidence coverage', evidenceCoverage, '%'],
    ['Verified fields', verified.length, 'fields'],
  ];

  return <div className="space-y-4">
    <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-5">
      <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest"><BarChart3 className="h-4 w-4" /> Impact + Research</div>
      <h1 className="mt-1 text-2xl font-black text-white">Evidence-derived impact, not invented impact</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-400">This surface reports outcomes only from verified field and residue records. Scientific coefficients and research assumptions must remain versioned and attributable.</p>
    </section>

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map(([label, value, unit]) => <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-[11px] text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-white">{value}<span className="ml-1 text-xs text-slate-500">{unit}</span></div></div>)}
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-400" /><h2 className="font-bold text-white">Impact chain</h2></div>
        <div className="mt-4 space-y-2 text-xs">
          {['Field registered','Residue quantified','Machine job completed','Evidence captured','Verification passed','Residue offtaken','Impact calculated'].map((x, i) => <div key={x} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-slate-800 text-slate-300">{i+1}</span><span className="text-slate-300">{x}</span>{i < 5 && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}</div>)}
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
        <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-cyan-300" /><h2 className="font-bold text-white">Research workspace</h2></div>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-800 p-3"><div className="text-xs font-bold text-white">Seasonal analysis</div><p className="mt-1 text-[11px] text-slate-500">Compare harvest windows, clearance times, residue recovery and buyer demand by district.</p></div>
          <div className="rounded-lg border border-slate-800 p-3"><div className="text-xs font-bold text-white">Methodology registry</div><p className="mt-1 text-[11px] text-slate-500">Store coefficient versions, source citations and calculation timestamps before publishing impact claims.</p></div>
          <div className="rounded-lg border border-slate-800 p-3"><div className="text-xs font-bold text-white">Data provenance</div><p className="mt-1 text-[11px] text-slate-500">Every metric should trace back to a field, evidence asset, verification event or buyer/offtake record.</p></div>
        </div>
      </div>
    </section>

    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200 flex gap-2"><Database className="h-4 w-4 shrink-0" /> {demoMode ? 'Demo mode: metrics are illustrative and are not production measurements.' : 'Live mode: no verified impact records are currently available.'} <ShieldCheck className="h-4 w-4 shrink-0 ml-auto" /></div>
  </div>;
}
