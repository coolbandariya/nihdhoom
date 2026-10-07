import { lazy, Suspense, useEffect, useCallback, startTransition } from 'react';
import { Header, ActiveTab } from './components/Header';
const DemoWalkthrough = lazy(() => import('./components/DemoWalkthrough').then((m) => ({ default: m.DemoWalkthrough })));
import { LiveKPIDashboard } from './components/LiveKPIDashboard';
const OpsMap = lazy(() => import('./components/OpsConsole/OpsMap').then((m) => ({ default: m.OpsMap })));
const VRPDispatchPanel = lazy(() => import('./components/OpsConsole/VRPDispatchPanel').then((m) => ({ default: m.VRPDispatchPanel })));
const FieldDetailDrawer = lazy(() => import('./components/OpsConsole/FieldDetailDrawer').then((m) => ({ default: m.FieldDetailDrawer })));
const TelegramSimulator = lazy(() => import('./components/FarmerSurface/TelegramSimulator').then((m) => ({ default: m.TelegramSimulator })));
const BalerPWA = lazy(() => import('./components/FieldOperator/BalerPWA').then((m) => ({ default: m.BalerPWA })));
const UpiSettlementModal = lazy(() => import('./components/FieldOperator/UpiSettlementModal').then((m) => ({ default: m.UpiSettlementModal })));
const SatelliteAudit = lazy(() => import('./components/VerificationLayer/SatelliteAudit').then((m) => ({ default: m.SatelliteAudit })));
const CarbonCertificate = lazy(() => import('./components/VerificationLayer/CarbonCertificate').then((m) => ({ default: m.CarbonCertificate })));
const MultiOfftakeAuction = lazy(() => import('./components/OfftakeAndForecast/MultiOfftakeAuction').then((m) => ({ default: m.MultiOfftakeAuction })));
const HarvestForecast = lazy(() => import('./components/OfftakeAndForecast/HarvestForecast').then((m) => ({ default: m.HarvestForecast })));
const JudgesQnAPanel = lazy(() => import('./components/PitchDefense/JudgesQnAPanel').then((m) => ({ default: m.JudgesQnAPanel })));
const JudgePitchDrawer = lazy(() => import('./components/PitchDefense/JudgePitchDrawer').then((m) => ({ default: m.JudgePitchDrawer })));
const CompetitionCenter = lazy(() => import('./components/PitchDefense/CompetitionCenter').then((m) => ({ default: m.CompetitionCenter })));
const SatelliteEarth3D = lazy(() => import('./components/ThreeD/SatelliteEarth3D').then((m) => ({ default: m.SatelliteEarth3D })));
const BalerModel3D = lazy(() => import('./components/ThreeD/BalerModel3D').then((m) => ({ default: m.BalerModel3D })));
const CardTilt3D = lazy(() => import('./components/ThreeD/CardTilt3D').then((m) => ({ default: m.CardTilt3D })));
const CarbonMarketplace = lazy(() => import('./components/CarbonMarketplace/CarbonMarketplace').then((m) => ({ default: m.CarbonMarketplace })));
const FarmerOnboarding = lazy(() => import('./components/FarmerOnboarding/FarmerOnboarding').then((m) => ({ default: m.FarmerOnboarding })));
const AgenticCommandCenter = lazy(() => import('./components/AgenticConsole/AgenticCommandCenter').then((m) => ({ default: m.AgenticCommandCenter })));
const AgenticTelemetryToast = lazy(() => import('./components/AgenticConsole/AgenticTelemetryToast').then((m) => ({ default: m.AgenticTelemetryToast })));
import { CommandCenter } from './components/CommandCenter/CommandCenter';
const ResiduePooling = lazy(() => import('./components/ResiduePooling/ResiduePooling').then((m) => ({ default: m.ResiduePooling })));
const ImpactResearch = lazy(() => import('./components/ImpactResearch/ImpactResearch').then((m) => ({ default: m.ImpactResearch })));
const HarvestIntelligence = lazy(() => import('./components/HarvestIntelligence/HarvestIntelligence').then((m) => ({ default: m.HarvestIntelligence })));
const FieldProvenancePanel = lazy(() => import('./components/FieldProvenance/FieldProvenancePanel').then((m) => ({ default: m.FieldProvenancePanel })));
const FieldJobBoard = lazy(() => import('./components/FieldJobs/FieldJobBoard').then((m) => ({ default: m.FieldJobBoard })));
const ClearanceBooking = lazy(() => import('./components/ClearanceBooking/ClearanceBooking').then((m) => ({ default: m.ClearanceBooking })));


import { INITIAL_STORAGE_YARDS, INITIAL_BUYERS } from './data/mockData';
import { Field } from './types';
import { prefetchWorkspace } from './lib/workspacePrefetch';
import { WorkspaceLoading } from './components/WorkspaceLoading';
import { useAppController } from './state/useAppController';
import { generateNonBurnCertificate } from './utils/spatialVerification';
import { Globe, Box, Map, Sparkles, ShieldCheck, Zap, UserCheck, Leaf } from 'lucide-react';

type WorkspaceHeaderProps = {
  activeTab: ActiveTab;
  demoMode: boolean;
  onNavigate: (tab: ActiveTab) => void;
};

const WORKSPACE_META: Partial<Record<ActiveTab, {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  accent: string;
  action?: { label: string; tab: ActiveTab };
}>> = {
  FIELD_JOBS: {
    eyebrow: 'FIELD OPERATIONS',
    title: 'My Fields & Clearance Jobs',
    description: 'See every registered field, its current state, evidence, machine assignment and next action in one readable workspace.',
    image: '/images/punjab_farmer_hero.jpg',
    accent: 'green',
    action: { label: 'Book a clearance', tab: 'FARMER_ONBOARDING' },
  },
  FARMER_ONBOARDING: {
    eyebrow: 'CLEARANCE',
    title: 'Book crop-residue clearance',
    description: 'Choose a field, confirm consent and request a clearance slot. Quotes and status are authoritative only when returned by the connected workflow.',
    image: '/images/farmer_phone.jpg',
    accent: 'amber',
    action: { label: 'View my fields', tab: 'FIELD_JOBS' },
  },
  FARMER_KYC: {
    eyebrow: 'FARMER ACCESS',
    title: 'Farmer onboarding',
    description: 'Set up your profile with phone OTP and consent before connecting field records or farmer communications.',
    image: '/images/farmer_manpreet.jpg',
    accent: 'green',
    action: { label: 'Open Telegram', tab: 'FARMER_SURFACE' },
  },
  OPS_CONSOLE: {
    eyebrow: 'LIVE OPERATIONS',
    title: 'Track clearance',
    description: 'Follow fields, machines, routes and operational evidence on the map. Live mode only shows records available from connected services.',
    image: '/images/baling_dispatch_fleet_1790447115856.jpg',
    accent: 'sky',
    action: { label: 'Open operator PWA', tab: 'BALER_OPERATOR' },
  },
  BALER_OPERATOR: {
    eyebrow: 'FIELD OPERATOR',
    title: 'Operator field workspace',
    description: 'Capture GPS, job progress and evidence from the field, including an offline queue when connectivity drops.',
    image: '/images/baler_machine.jpg',
    accent: 'sky',
    action: { label: 'Track machines', tab: 'OPS_CONSOLE' },
  },
  RESIDUE_POOLS: {
    eyebrow: 'RESIDUE MARKET',
    title: 'Pool verified residue for offtake',
    description: 'Group verified residue lots around real buyer demand, pickup constraints and quality requirements instead of showing speculative sales.',
    image: '/images/offtake_facility.jpg',
    accent: 'amber',
    action: { label: 'Explore buyer offtake', tab: 'OFFTAKE_AUCTION' },
  },
  SATELLITE_AUDIT: {
    eyebrow: 'FIELD TRUST',
    title: 'Evidence & verification',
    description: 'Review field evidence and remote-sensing observations as separate layers. Satellite observations support verification; they do not become proof by themselves.',
    image: '/images/satellite_firms.jpg',
    accent: 'sky',
    action: { label: 'Open field trust', tab: 'FIELD_PROVENANCE' },
  },
  IMPACT_RESEARCH: {
    eyebrow: 'IMPACT',
    title: 'Impact & research',
    description: 'Understand the evidence behind the residue problem, operational outcomes and methodology boundaries without mixing research statistics with live records.',
    image: '/images/parali_burning.jpg',
    accent: 'green',
    action: { label: 'Harvest intelligence', tab: 'HARVEST_INTELLIGENCE' },
  },
  HARVEST_INTELLIGENCE: {
    eyebrow: 'HARVEST INTELLIGENCE',
    title: 'Harvest pressure & timing',
    description: 'Turn harvest windows, field readiness and machine capacity into a clearer operational picture for the next few days.',
    image: '/images/punjab_farm_hero.jpg',
    accent: 'amber',
    action: { label: 'Open dispatch', tab: 'OPS_CONSOLE' },
  },
  FIELD_PROVENANCE: {
    eyebrow: 'FIELD TRUST',
    title: 'Field provenance',
    description: 'Trace the field record, boundary source, consent, evidence and verification state so every operational decision has a visible reason.',
    image: '/images/farmer_phone.jpg',
    accent: 'green',
    action: { label: 'Verify fields', tab: 'SATELLITE_AUDIT' },
  },
  FARMER_SURFACE: {
    eyebrow: 'FARMER CHANNEL',
    title: 'NIRDHOOM on Telegram',
    description: 'Connect a farmer account securely, use local-language messaging and move between booking, tracking and evidence without exposing secrets.',
    image: '/images/farmer_phone.jpg',
    accent: 'sky',
    action: { label: 'Book clearance', tab: 'FARMER_ONBOARDING' },
  },
  OFFTAKE_AUCTION: {
    eyebrow: 'BUYER NETWORK',
    title: 'Buyer offtake & demand',
    description: 'Compare conditional buyer requirements, residue quality and harvest forecasts. Nothing is presented as a confirmed contract until a real contract exists.',
    image: '/images/cbg_mushroom_offtake_1790447167269.jpg',
    accent: 'amber',
    action: { label: 'Open residue pools', tab: 'RESIDUE_POOLS' },
  },
  CARBON_MARKET: {
    eyebrow: 'CARBON & IMPACT',
    title: 'Carbon marketplace',
    description: 'Explore the registry pathway and evidence model without presenting illustrative credits as issued carbon assets.',
    image: '/images/satellite_firms.jpg',
    accent: 'green',
    action: { label: 'View verification', tab: 'SATELLITE_AUDIT' },
  },
  AGENTIC_CONSOLE: {
    eyebrow: 'AI OPERATIONS',
    title: 'AI dispatch assistant',
    description: 'Use bounded automation to inspect field conditions, propose routes and surface evidence. Human approval stays in the loop for consequential actions.',
    image: '/images/baling_dispatch_fleet_1790447115856.jpg',
    accent: 'sky',
    action: { label: 'Open operations', tab: 'OPS_CONSOLE' },
  },
  DIGITAL_TWIN_3D: {
    eyebrow: 'SPATIAL VIEW',
    title: '3D field twin',
    description: 'Explore the spatial model as an explanatory view of fields and operations. It is not a substitute for authoritative field geometry.',
    image: '/images/punjab_farm_hero.jpg',
    accent: 'sky',
    action: { label: 'Open 2D map', tab: 'OPS_CONSOLE' },
  },
  MACHINERY_3D: {
    eyebrow: 'MACHINE VIEW',
    title: '3D baler twin',
    description: 'Inspect the machinery concept and connect it back to the operator workflow and dispatch system.',
    image: '/images/baler_machine.jpg',
    accent: 'sky',
    action: { label: 'Open operator PWA', tab: 'BALER_OPERATOR' },
  },
  DEMO_RUNNER: {
    eyebrow: 'PRODUCT WALKTHROUGH',
    title: 'NIRDHOOM end-to-end walkthrough',
    description: 'A controlled demonstration of the field → machine → evidence → residue journey. Demo records are clearly separated from live records.',
    image: '/images/baling_dispatch_fleet_1790447115856.jpg',
    accent: 'amber',
  },
  COMPETITION_CENTER: {
    eyebrow: 'COMPETITION READY',
    title: 'RIDE & WarriorHacks pitch center',
    description: 'A focused judging workspace for the two competitions: startup/incubation for RIDE and community impact + technical craft for WarriorHacks.',
    image: '/images/punjab_farmer_hero.jpg',
    accent: 'amber',
    action: { label: 'Start the 2-minute demo', tab: 'DEMO_RUNNER' },
  },
  JUDGE_DEFENSE: {
    eyebrow: 'PITCH DEFENCE',
    title: 'Judge Q&A & product proof',
    description: 'Keep the story, constraints, evidence and release boundaries in one place for a clear technical demonstration.',
    image: '/images/punjab_farm_hero.jpg',
    accent: 'green',
  },
};

function WorkspaceHeader({ activeTab, demoMode, onNavigate }: WorkspaceHeaderProps) {
  const meta = WORKSPACE_META[activeTab];
  if (!meta) return null;
  const accentClass = meta.accent === 'amber' ? 'is-amber' : meta.accent === 'sky' ? 'is-sky' : 'is-green';
  const journey = [
    { label: 'Field', tab: 'FIELD_JOBS' as ActiveTab },
    { label: 'Book', tab: 'FARMER_ONBOARDING' as ActiveTab },
    { label: 'Machine', tab: 'OPS_CONSOLE' as ActiveTab },
    { label: 'Proof', tab: 'SATELLITE_AUDIT' as ActiveTab },
    { label: 'Parali', tab: 'RESIDUE_POOLS' as ActiveTab },
  ];
  const activeJourney = journey.findIndex((item) => item.tab === activeTab);
  const journeyIndex = activeJourney >= 0 ? activeJourney : activeTab === 'BALER_OPERATOR' ? 2 : activeTab === 'FIELD_PROVENANCE' ? 0 : activeTab === 'OFFTAKE_AUCTION' ? 4 : 0;

  return (
    <section className={`workspace-hero ${accentClass}`} aria-labelledby="workspace-title">
      <div className="workspace-hero-copy">
        <div className="workspace-eyebrow">
          <span className="workspace-eyebrow-dot" />
          {meta.eyebrow}
          <span className="workspace-mode">{demoMode ? 'Demo records' : 'Live records'}</span>
        </div>
        <h1 id="workspace-title">{meta.title}</h1>
        <p>{meta.description}</p>
        {meta.action && (
          <button type="button" onClick={() => onNavigate(meta.action!.tab)} onMouseEnter={() => prefetchWorkspace(meta.action!.tab)} onFocus={() => prefetchWorkspace(meta.action!.tab)} className="workspace-action">
            {meta.action.label} <span aria-hidden="true">→</span>
          </button>
        )}

        <div className="workspace-journey" aria-label="NIRDHOOM journey">
          {journey.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`workspace-journey-step ${index === journeyIndex ? 'is-current' : ''} ${index < journeyIndex ? 'is-done' : ''}`}
              onClick={() => onNavigate(item.tab)}
              onMouseEnter={() => prefetchWorkspace(item.tab)}
              onFocus={() => prefetchWorkspace(item.tab)}
              title={item.label}
            >
              <span className="workspace-journey-number">{index + 1}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="workspace-hero-image" aria-hidden="true">
        <img src={meta.image} alt="" loading="lazy" />
        <div className="workspace-hero-image-scrim" />
      </div>
    </section>
  );
}

export function App() {
  const {
    activeTab,
    setActiveTab,
    fields,
    machines,
    fireEvents,
    selectedField,
    setSelectedField,
    activeRoutePolyline,
    setActiveRoutePolyline,
    isPitchDrawerOpen,
    setIsPitchDrawerOpen,
    certificateField,
    setCertificateField,
    fieldForUpiModal,
    setFieldForUpiModal,
    handleUpdateFieldStatus,
    demoMode,
    loadingLiveData,
    liveDataError,
  } = useAppController();

  const acresScheduled = fields.reduce((sum, field) => sum + (Number(field.acreage) || 0), 0);
  const verifiedCount = fields.filter((field) => field.is_verified_non_burn || field.status === 'VERIFIED_NON_BURN').length;

  useEffect(() => {
    const demoOnlyTabs: ActiveTab[] = [
      'AGENTIC_CONSOLE',
      'DIGITAL_TWIN_3D',
      'MACHINERY_3D',
      'OFFTAKE_AUCTION',
      'CARBON_MARKET',
      'JUDGE_DEFENSE',
    ];
    if (!demoMode && demoOnlyTabs.includes(activeTab)) setActiveTab('OVERVIEW');
  }, [activeTab, demoMode, setActiveTab]);

  const navigate = useCallback((tab: ActiveTab) => {
    startTransition(() => setActiveTab(tab));
  }, [setActiveTab]);

  const handleSelectField = (field: Field) => {
    setSelectedField(field);
  };

  return (
    <div data-active-tab={activeTab} className="nirdhoom-field-app min-h-screen bg-[var(--bg-deep)] text-[var(--text)] flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={demoMode}
      />

      {!demoMode && loadingLiveData && <div className="mx-auto w-full max-w-7xl px-4 pt-2 text-xs text-cyan-300">Loading live Supabase operational records…</div>}
      {!demoMode && liveDataError && <div className="mx-auto w-full max-w-7xl px-4 pt-2 text-xs text-amber-300">Live data unavailable: {liveDataError}</div>}

      {/* Main Content Area */}
      <main id="main-content" className="field-main flex-1 w-full max-w-[1480px] mx-auto px-3 sm:px-5 lg:px-7 py-5 sm:py-7 relative z-10">
        <Suspense fallback={<WorkspaceLoading />}>
        {activeTab !== 'OVERVIEW' && <WorkspaceHeader activeTab={activeTab} demoMode={demoMode} onNavigate={navigate} />}

        {/* PRIMARY PRODUCT SURFACE: RESIDUE-FIRST COMMAND CENTER */}
        {activeTab === 'OVERVIEW' && (
          <CommandCenter
            fields={fields}
            machines={machines}
            fireEvents={fireEvents}
            storageYards={demoMode ? INITIAL_STORAGE_YARDS : []}
            buyers={demoMode ? INITIAL_BUYERS : []}
            onSelectField={handleSelectField}
            onOpenResidue={() => navigate('RESIDUE_POOLS')}
            onOpenImpact={() => navigate('IMPACT_RESEARCH')}
            onNavigate={(tab) => navigate(tab as ActiveTab)}
          />
        )}

        {activeTab === 'FARMER_ONBOARDING' && (
          <ClearanceBooking fields={fields} demoMode={demoMode} onBooked={(fieldId, amount) => handleUpdateFieldStatus(fieldId, 'BOOKED', amount)} />
        )}

        {activeTab === 'FARMER_KYC' && (
          <FarmerOnboarding />
        )}

        {activeTab === 'RESIDUE_POOLS' && (
          <ResiduePooling fields={fields} demoMode={demoMode} />
        )}

        {activeTab === 'IMPACT_RESEARCH' && (
          <ImpactResearch fields={fields} demoMode={demoMode} />
        )}

        {activeTab === 'FIELD_JOBS' && (
          <FieldJobBoard
            fields={fields}
            machines={machines}
            demoMode={demoMode}
            onSelectField={handleSelectField}
            onOpenDispatch={() => navigate('OPS_CONSOLE')}
            onOpenResidue={() => navigate('RESIDUE_POOLS')}
            onOpenImpact={() => navigate('IMPACT_RESEARCH')}
          />
        )}

        {activeTab === 'FIELD_PROVENANCE' && (
          <FieldProvenancePanel fields={fields} demoMode={demoMode} />
        )}

        {activeTab === 'HARVEST_INTELLIGENCE' && (
          <HarvestIntelligence fields={fields} machines={machines} demoMode={demoMode} />
        )}

        {/* TAB 0: AGENTIC AI MULTI-AGENT SWARM */}
        {activeTab === 'AGENTIC_CONSOLE' && (
          <AgenticCommandCenter
            onTriggerDemoBeat={(_beat) => setActiveTab('DEMO_RUNNER')}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {/* TAB 1: 4-BEAT DEMO WALKTHROUGH */}
        {activeTab === 'DEMO_RUNNER' && (
          <div className="flex flex-col gap-2">
            <LiveKPIDashboard
              demoMode={demoMode}
              acresScheduled={acresScheduled}
              co2Avoided={0}
              firmsZeroBurnCount={verifiedCount}
              activeMachines={machines.length}
              fireEventsOutsideCount={fireEvents.length}
            />
            <DemoWalkthrough
              fields={fields}
              machines={machines}
              fireEvents={fireEvents}
              demoMode={demoMode}
              onUpdateFieldStatus={handleUpdateFieldStatus}
              onViewCertificateModal={(f) => setCertificateField(f)}
            />
          </div>
        )}

        {/* TAB: 3D DIGITAL TWIN (HOLOGRAPHIC SATELLITE & HOTSPOT SCAN) */}
        {activeTab === 'DIGITAL_TWIN_3D' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-emerald-500/30">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-extrabold text-lg text-white font-['Outfit']">
                    3D Geospatial Agricultural Digital Twin
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Interactive Three.js spatial model of the Punjab Malwa hotspot using demo field, satellite, and fire-event data.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('MACHINERY_3D')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Inspect 3D Baler</span>
                </button>
                <button
                  onClick={() => setActiveTab('OPS_CONSOLE')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Switch to 2D GIS Map</span>
                </button>
              </div>
            </div>

            <SatelliteEarth3D
              fields={fields}
              fireEvents={fireEvents}
              onSelectField={handleSelectField}
            />

            {/* Telemetry Summary Cards with 3D Tilt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CardTilt3D>
                <div className="glass-panel p-4 border-emerald-500/30 h-full">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>3D Verified Parcels</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    {fields.length} Polygons
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Illustrative thermal intersection check
                  </p>
                </div>
              </CardTilt3D>

              <CardTilt3D>
                <div className="glass-panel p-4 border-red-500/30 h-full">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Active Thermal Plumes</span>
                    <span className="text-sm">🔥</span>
                  </div>
                  <div className="text-xl font-extrabold text-red-400 font-mono">
                    {fireEvents.length} Points
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Demo fire events shown outside customer boundaries
                  </p>
                </div>
              </CardTilt3D>

              <CardTilt3D>
                <div className="glass-panel p-4 border-cyan-500/30 h-full">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Satellite Sensor</span>
                    <Globe className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-extrabold text-cyan-300 font-mono">
                    VIIRS 375m — Demo
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Illustrative satellite metadata • demo freshness
                  </p>
                </div>
              </CardTilt3D>
            </div>
          </div>
        )}

        {/* TAB: 3D BALER MACHINERY TWIN */}
        {activeTab === 'MACHINERY_3D' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-cyan-500/30">
              <div>
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-extrabold text-lg text-white font-['Outfit']">
                    3D Baler Machinery Twin — Demo
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Wedge 1 Asset Strategy: Interactive 3D machinery model for the field-operations prototype.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('DIGITAL_TWIN_3D')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>3D Digital Twin</span>
                </button>
                <button
                  onClick={() => setActiveTab('BALER_OPERATOR')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>Open Field PWA</span>
                </button>
              </div>
            </div>

            <BalerModel3D />
          </div>
        )}

        {/* TAB 2: OPS COMMAND CONSOLE (The Real Product) */}
        {activeTab === 'OPS_CONSOLE' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <h2 className="font-extrabold text-base text-white font-['Outfit']">
                  Central Ops & VRP Dispatch Console
                </h2>
                <p className="text-xs text-slate-400">
                  GIS operations prototype for a Sangrur cluster using demo machinery and FIRMS-style event data
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('DIGITAL_TWIN_3D')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>View in 3D</span>
                </button>
                <span className="badge badge-emerald text-xs">
                  {demoMode ? 'Demo GPS feed' : 'Live operator telemetry'}
                </span>
                <span className="text-xs text-slate-400">
                  {fields.length} Farms • {machines.length} Balers
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 flex flex-col gap-3">
                <OpsMap
                  fields={fields}
                  machines={machines}
                  fireEvents={fireEvents}
                  storageYards={demoMode ? INITIAL_STORAGE_YARDS : []}
                  buyers={demoMode ? INITIAL_BUYERS : []}
                  selectedField={selectedField}
                  demoMode={demoMode}
                  onSelectField={handleSelectField}
                  activeRoutePolyline={activeRoutePolyline}
                />

                {selectedField && (
                  <FieldDetailDrawer
                    demoMode={demoMode}
                    field={selectedField}
                    onClose={() => setSelectedField(null)}
                    onTriggerUpiPayout={(f) => setFieldForUpiModal(f)}
                    onViewCertificate={(f) => setCertificateField(f)}
                  />
                )}
              </div>

              <div className="lg:col-span-4">
                <VRPDispatchPanel
                  fields={fields}
                  machines={machines}
                  onRouteSelected={(route) => setActiveRoutePolyline(route)}
                  onSelectField={handleSelectField}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FARMER TELEGRAM & IVR SURFACE */}
        {activeTab === 'FARMER_SURFACE' && (
          <TelegramSimulator
            onSlotConfirmed={(fId) => handleUpdateFieldStatus(fId, 'SCHEDULED')}
          />
        )}

        {/* TAB 4: FIELD BALER OPERATOR PWA */}
        {activeTab === 'BALER_OPERATOR' && (
          machines[0] ? (
            <BalerPWA
              fields={fields}
              activeMachine={machines[0]}
              demoMode={demoMode}
              onJobCompleted={(fId, amt) => handleUpdateFieldStatus(fId, 'CLEARED_PENDING_AUDIT', amt)}
            />
          ) : (
            <div className="glass-panel p-6 max-w-3xl mx-auto">
              <h2 className="text-lg font-extrabold text-white">Field Operator PWA</h2>
              <p className="text-sm text-slate-300 mt-2">
                No live machine is assigned yet. Connect an operator machine record before starting field operations.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <span className="text-slate-500 block">Live fields</span>
                  <strong className="text-white">{fields.length}</strong>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <span className="text-slate-500 block">Assigned machines</span>
                  <strong className="text-white">{machines.length}</strong>
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 5: REMOTE-SENSING EVIDENCE AUDIT */}
        {activeTab === 'SATELLITE_AUDIT' && (
          <SatelliteAudit
            fields={fields}
            fireEvents={fireEvents}
            demoMode={demoMode}
          />
        )}

        {/* TAB 6: MULTI-OFFTAKE AUCTION & HARVEST FORECAST */}
        {activeTab === 'OFFTAKE_AUCTION' && (
          <div className="flex flex-col gap-8">
            <MultiOfftakeAuction />
            <HarvestForecast />
          </div>
        )}

        {/* TAB: CARBON CREDIT MARKETPLACE */}
        {activeTab === 'CARBON_MARKET' && (
          <CarbonMarketplace />
        )}

        {/* TAB: FARMER ONBOARDING KYC */}
        {/* TAB 7: JUDGE DEFENSE & UNIT ECONOMICS */}
        {activeTab === 'COMPETITION_CENTER' && (
          <CompetitionCenter onNavigate={setActiveTab} />
        )}

        {activeTab === 'JUDGE_DEFENSE' && (
          <JudgesQnAPanel />
        )}
        </Suspense>
      </main>

      {/* Global Modals */}
      {/* 1. Illustrative internal verification record modal */}
      {certificateField && (
        <CarbonCertificate
          certificate={generateNonBurnCertificate(certificateField)}
          onClose={() => setCertificateField(null)}
        />
      )}

      {/* 2. Simulated settlement record modal */}
      {fieldForUpiModal && (
        <UpiSettlementModal
          field={fieldForUpiModal}
          onClose={() => setFieldForUpiModal(null)}
          onSettlementComplete={(fId, amt) => {
            handleUpdateFieldStatus(fId, 'CLEARED_PENDING_AUDIT', amt);
            setTimeout(() => setFieldForUpiModal(null), 2500);
          }}
        />
      )}

      {/* 3. Judge Pitch Brief Drawer */}
      <JudgePitchDrawer
        isOpen={isPitchDrawerOpen}
        onClose={() => setIsPitchDrawerOpen(false)}
      />

      {/* Live Agentic Telemetry Toast Stream */}
      <AgenticTelemetryToast demoMode={demoMode} onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)} />

      {/* Modern Footer */}
      <footer className="mt-auto border-t border-emerald-500/15 bg-slate-950/95 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-emerald-400 font-['Outfit'] text-base">NIRDHOOM (ਨਿਰਧੂਮ)</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">The Parali Reframe</span>
          </div>

          <div className="text-slate-500 text-[11px] text-center">
            3D Digital Twin • Dispatch Simulation • Satellite Audit Prototype • Payment Simulation • Carbon Marketplace Demo
          </div>

          <button
            onClick={() => setIsPitchDrawerOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Review Pitch Deck &rarr;
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
