import { 
  Sparkles, 
  Map, 
  MessageSquare, 
  Smartphone, 
  Satellite, 
  TrendingUp, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Box, 
  Globe,
  Leaf,
  UserCheck,
  Bot,
  Layers3,
  BarChart3
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';


export type ActiveTab = 
  | 'OVERVIEW'
  | 'RESIDUE_POOLS'
  | 'IMPACT_RESEARCH'
  | 'AGENTIC_CONSOLE'
  | 'DEMO_RUNNER'
  | 'DIGITAL_TWIN_3D'
  | 'MACHINERY_3D'
  | 'OPS_CONSOLE'
  | 'FARMER_SURFACE'
  | 'BALER_OPERATOR'
  | 'SATELLITE_AUDIT'
  | 'OFFTAKE_AUCTION'
  | 'CARBON_MARKET'
  | 'FARMER_ONBOARDING'
  | 'JUDGE_DEFENSE';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openPitchDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openPitchDrawer,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#03060f]/90 backdrop-blur-md border-b border-emerald-500/20 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Pitch One-liner badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('OVERVIEW')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <div className="w-full h-full bg-[#03060f] rounded-[10px] flex items-center justify-center">
                <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent font-['Outfit']">
                  ਨਿ
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white font-['Outfit']">
                  NIRDHOOM
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40">
                  DEMO / SIMULATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Field operations prototype • simulated data unless marked live
              </p>
            </div>
          </div>

          {/* Quick Pitch One-Liner trigger & Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={openPitchDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
              title="Read the 30-second Judge Pitch Deck"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Judge Brief</span>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="hidden xl:flex items-center gap-3.5 text-xs font-medium bg-slate-900/80 px-4 py-1.5 rounded-full border border-emerald-500/25 shadow-inner">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">Punjab Hotspot 3D</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-500">Idle CRM:</span>
            <span className="text-emerald-300 font-mono font-bold">Demo dataset</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500">VIIRS:</span>
            <span className="text-amber-300 font-bold">Demo screen</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-amber-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Payments disabled</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {/* Overview & Strategic Bento Hub */}
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/40 ring-1 ring-emerald-300'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('RESIDUE_POOLS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'RESIDUE_POOLS' ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30' : 'text-amber-300 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <Layers3 className="w-3.5 h-3.5" />
            <span>Residue Pools</span>
          </button>

          <button
            onClick={() => setActiveTab('IMPACT_RESEARCH')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'IMPACT_RESEARCH' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30' : 'text-cyan-300 hover:text-cyan-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Impact & Research</span>
          </button>

          {/* Agentic AI Swarm Console Tab */}
          <button
            onClick={() => setActiveTab('AGENTIC_CONSOLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'AGENTIC_CONSOLE'
                ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-300'
                : 'text-cyan-400 hover:text-cyan-200 hover:bg-slate-900 border border-cyan-500/30'
            }`}
          >
            <Bot className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
            <span>Agentic Swarm</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          </button>

          <button
            onClick={() => setActiveTab('DEMO_RUNNER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'DEMO_RUNNER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4-Beat Demo</span>
          </button>

          {/* 3D Digital Twin Tab */}
          <button
            onClick={() => setActiveTab('DIGITAL_TWIN_3D')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'DIGITAL_TWIN_3D'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/40 ring-1 ring-teal-400'
                : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Digital Twin</span>
          </button>

          {/* 3D Baler Machinery Tab */}
          <button
            onClick={() => setActiveTab('MACHINERY_3D')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'MACHINERY_3D'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-400'
                : 'text-cyan-400/90 hover:text-cyan-300 hover:bg-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Baler Model</span>
          </button>

          <button
            onClick={() => setActiveTab('OPS_CONSOLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'OPS_CONSOLE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Ops Map</span>
          </button>

          <button
            onClick={() => setActiveTab('FARMER_SURFACE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'FARMER_SURFACE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('BALER_OPERATOR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'BALER_OPERATOR'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Field PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('SATELLITE_AUDIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'SATELLITE_AUDIT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Verification</span>
          </button>

          <button
            onClick={() => setActiveTab('OFFTAKE_AUCTION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'OFFTAKE_AUCTION'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Auction</span>
          </button>

          <button
            onClick={() => setActiveTab('CARBON_MARKET')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'CARBON_MARKET'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/30 ring-1 ring-teal-400'
                : 'text-teal-400/90 hover:text-teal-300 hover:bg-slate-900'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Carbon Market</span>
          </button>

          <button
            onClick={() => setActiveTab('FARMER_ONBOARDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'FARMER_ONBOARDING'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
                : 'text-cyan-400/90 hover:text-cyan-300 hover:bg-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Onboarding</span>
          </button>

          <button
            onClick={() => setActiveTab('JUDGE_DEFENSE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'JUDGE_DEFENSE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Judge Q&A</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
