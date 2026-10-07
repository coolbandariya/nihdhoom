import React, { useState } from 'react';
import { Field, Machine, LatLng } from '../../types';
import { runVRPOptimizer, fromServerDispatchPlan, VRPDispatchResult } from '../../utils/vrpOptimizer';
import { supabase } from '../../lib/supabase';
import { 
  Cpu, 
  CheckCircle2, 
  Route, 
  Clock, 
  ShieldAlert, 
  Percent, 
  ArrowRight, 
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';

interface VRPDispatchPanelProps {
  fields: Field[];
  machines: Machine[];
  onRouteSelected: (route: LatLng[]) => void;
  onSelectField: (field: Field) => void;
}

export const VRPDispatchPanel: React.FC<VRPDispatchPanelProps> = ({
  fields,
  machines,
  onRouteSelected,
  onSelectField,
}) => {
  const [optimizerResult, setOptimizerResult] = useState<VRPDispatchResult | null>(() =>
    runVRPOptimizer(fields, machines)
  );
  const [isSolving, setIsSolving] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');

  const handleRunOptimizer = async () => {
    setIsSolving(true);
    setDispatchError('');
    try {
      if (supabase && import.meta.env.VITE_NIRDHOOM_DEMO_MODE !== 'true') {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Sign in with an authorized dispatcher account before running live dispatch.');
        const started = performance.now();
        const response = await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            fields: fields.map((f) => ({
              id: f.id,
              lat: f.center.lat,
              lng: f.center.lng,
              acres: f.acreage,
              deadline: f.clearance_deadline,
            })),
            machines: machines.map((m) => ({
              id: m.id,
              lat: m.current_location.lat,
              lng: m.current_location.lng,
              capacity_acres_day: m.capacity_acres_day,
              status: m.status,
            })),
          }),
        });
        const plan = await response.json();
        if (!response.ok) throw new Error(plan?.error || 'Dispatch service rejected the request.');
        const res = fromServerDispatchPlan(plan, fields, machines, Math.round(performance.now() - started));
        setOptimizerResult(res);
        if (res.assignments.length > 0) {
          onRouteSelected(res.assignments[0].routeCoordinates);
          setSelectedMachineId(res.assignments[0].machineId);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const res = runVRPOptimizer(fields, machines);
        setOptimizerResult(res);
        if (res.assignments.length > 0) {
          onRouteSelected(res.assignments[0].routeCoordinates);
          setSelectedMachineId(res.assignments[0].machineId);
        }
      }
    } catch (error) {
      setOptimizerResult(null);
      setDispatchError(error instanceof Error ? error.message : 'Unable to run dispatch planner. Try again or review the dispatch inputs.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    const assign = optimizerResult?.assignments.find((a) => a.machineId === machineId);
    if (assign) {
      onRouteSelected(assign.routeCoordinates);
    }
  };

  return (
    <div className="glass-panel p-4 flex h-full flex-col gap-4">
      {/* Panel Header & Run Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white tracking-tight">
              Capacity Match & Route Planner
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Match available machine capacity to field demand, then optimise the route. Live capacity is authoritative only when returned by the connected service.
          </p>
        </div>

        <button
          onClick={handleRunOptimizer}
          disabled={isSolving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-lg transition-all cursor-pointer ${
            isSolving
              ? 'bg-slate-700 text-slate-300'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
          }`}
        >
          {isSolving ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin text-emerald-300" />
              <span>Solving Constraints...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{optimizerResult?.source === 'server-ortools' ? 'Re-run live OR-Tools plan' : optimizerResult?.source === 'server-fallback' ? 'Re-run server fallback' : 'Run dispatch planner'}</span>
            </>
          )}
        </button>
      </div>

      {dispatchError && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-3 text-sm text-red-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
          <div>
            <strong className="block text-red-100">Dispatch planner could not run</strong>
            <span className="text-red-200/80">{dispatchError}</span>
          </div>
        </div>
      )}

      {/* Real-time Optimization Telemetry Tiles */}
      {optimizerResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Scheduled Load</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-white mt-1 font-mono">
              {optimizerResult.totalAcresScheduled}{' '}
              <span className="text-xs text-emerald-400 font-normal">acres</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              {optimizerResult.unassignedFieldIds.length === 0 ? 'All eligible fields assigned' : `${optimizerResult.unassignedFieldIds.length} field(s) unassigned`}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Deadhead Travel</span>
              <Route className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-extrabold text-cyan-300 mt-1 font-mono">
              {optimizerResult.totalDeadheadKm}{' '}
              <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
              {optimizerResult.source === 'server-ortools' ? 'Server solver result' : 'Local heuristic estimate'}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Unassigned Work</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-extrabold text-amber-300 mt-1 font-mono">
              {optimizerResult.unassignedFieldIds.length}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              Unassigned fields
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Fleet Utilisation</span>
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-white mt-1 font-mono">
              {optimizerResult.fleetUtilizationPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {optimizerResult.source === 'server-ortools' ? 'OR-Tools service' : 'Local heuristic'} • {optimizerResult.solverExecutionTimeMs} ms
            </div>
          </div>
        </div>
      )}

      {/* Machine Fleet Schedule Cards */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Machine matches & sequenced routes</span>
          <span className="text-[11px] text-emerald-400 font-normal">
            Click a match to inspect why the route was selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {optimizerResult?.assignments.map((assign) => {
            const isSelected = selectedMachineId === assign.machineId;
            return (
              <div
                key={assign.machineId}
                onClick={() => handleSelectMachine(assign.machineId)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900/95 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚜</span>
                    <span className="font-bold text-sm text-white">
                      {assign.machineName}
                    </span>
                  </div>
                  <span className="badge badge-emerald text-[10px]">
                    {assign.capacityPct}% Capacity
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between mb-2">
                  <span>Operator: <strong className="text-slate-200">{assign.operatorName}</strong></span>
                  <span className="font-mono text-emerald-400 font-semibold">{assign.totalAcres} ac / {assign.deadheadKm} km</span>
                </div>

                {/* Step sequence breakdown */}
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80 text-[11px] flex flex-col gap-1">
                  {assign.sequenceDescriptions.map((desc, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-emerald-500 font-bold shrink-0">{idx + 1}.</span>
                      <span className="truncate">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
