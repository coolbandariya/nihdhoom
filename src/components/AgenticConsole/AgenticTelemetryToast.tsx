import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Satellite, 
  CheckCircle2, 
  Zap, 
  X, 
  TrendingUp, 
  Radio, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

interface TelemetryEvent {
  id: string;
  icon: 'satellite' | 'vrp' | 'auction';
  title: string;
  detail: string;
  badge: string;
  time: string;
  targetTab?: string;
}

const STREAM_EVENTS: TelemetryEvent[] = [
  {
    id: 'evt-1',
    icon: 'satellite',
    title: 'FIRMS / VIIRS observation review',
    detail: 'Synthetic thermal observation example; no absence-of-fire conclusion is issued.',
    badge: 'DEMO EVIDENCE',
    time: 'Just now',
    targetTab: 'SATELLITE_AUDIT',
  },
  {
    id: 'evt-2',
    icon: 'vrp',
    title: 'OR-Tools VRP Re-routing Complete',
    detail: 'Baler PB-11-CH-4902 auto-assigned to Sukhbir Singh parcel (48h deadline locked).',
    badge: 'VRP DISPATCH',
    time: '2m ago',
    targetTab: 'OPS_CONSOLE',
  },
  {
    id: 'evt-3',
    icon: 'vrp',
    title: 'Completion workflow (simulated)',
    detail: 'Synthetic completion event for the demo. No provider transaction or receipt is created.',
    badge: 'SIMULATED',
    time: '4m ago',
    targetTab: 'BALER_OPERATOR',
  },
  {
    id: 'evt-4',
    icon: 'auction',
    title: 'Buyer matching example (simulated)',
    detail: 'Synthetic buyer-demand example. Live offers require connected buyer records.',
    badge: 'SIMULATED',
    time: '6m ago',
    targetTab: 'OFFTAKE_AUCTION',
  },
];

export const AgenticTelemetryToast: React.FC<{
  onNavigateTab?: (tab: string) => void;
  demoMode: boolean;
}> = ({ onNavigateTab, demoMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Cycle telemetry events periodically to show active streaming
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % STREAM_EVENTS.length);
    }, 11000);
    return () => clearInterval(timer);
  }, []);

  const currentEvent = demoMode ? STREAM_EVENTS[currentIndex] : {
    id: 'live-status', icon: 'vrp' as const, title: 'Live telemetry surface',
    detail: 'Live operational events are shown only from connected records. No synthetic payout, fire or buyer events are injected into live mode.',
    badge: 'LIVE RECORDS', time: 'current', targetTab: 'OPS_CONSOLE',
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Real-time Telemetry Stream" className="nirdhoom-telemetry fixed bottom-5 right-5 z-40 max-w-sm w-full px-3 sm:px-0">
      <div className="telemetry-card glass-panel p-3.5 rounded-2xl border shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="badge--dot" />
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold telemetry-kicker">
              Telemetry Stream
            </span>
            <span className="text-[10px] font-mono telemetry-muted">
              {demoMode ? `(${currentIndex + 1}/${STREAM_EVENTS.length})` : '(live)'}
            </span>
          </div>

          <div className="flex items-center gap-1 telemetry-actions">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="telemetry-icon-button p-1 rounded transition-all cursor-pointer"
              title={isMinimized ? 'Expand' : 'Collapse'}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <div className="telemetry-event-icon w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5">
                {currentEvent.icon === 'satellite' && <Satellite className="w-4 h-4 text-emerald-400" />}
                {currentEvent.icon === 'vrp' && <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />}
                {currentEvent.icon === 'auction' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold truncate telemetry-title">
                    {currentEvent.title}
                  </span>
                  <span className="text-[10px] font-mono flex-shrink-0 telemetry-muted">
                    {currentEvent.time}
                  </span>
                </div>
                <p className="text-[11px] leading-snug line-clamp-2 telemetry-detail">
                  {currentEvent.detail}
                </p>
              </div>
            </div>

            {currentEvent.targetTab && (
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="telemetry-badge badge text-[9px] py-0 px-1.5">
                  {currentEvent.badge}
                </span>
                <button
                  onClick={() => onNavigateTab?.(currentEvent.targetTab!)}
                  className="telemetry-inspect text-[11px] font-mono font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Inspect Layer &rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
