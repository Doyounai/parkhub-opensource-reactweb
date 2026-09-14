import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

import { I18nDomainResource } from './i18n';
import { useAreaDetail, useAreaList } from '../../global/hook/useArea';
import {
  useAnalyticsSummary,
  useOccupancyTimeline,
  useSlotHeatmap,
  useArrivalRate,
  AnalyticsParams,
} from '../../global/hook/useAnalytics';

import KpiCards from '../p009-area-analytics/ui/kpi-cards';
import OccupancyChart from '../p009-area-analytics/ui/occupancy-chart';
import SlotHeatmap from '../p009-area-analytics/ui/slot-heatmap';
import ArrivalChart from '../p009-area-analytics/ui/arrival-chart';

const domainName = 'main-dashboard';
const i18n = I18nDomainResource(domainName);

const toIso = (d: Date) => d.toISOString();
const daysAgoIso = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toIso(d); };

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const AreaSidebar = ({ currentId, isOpen, onClose }: { currentId: number; isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { data } = useAreaList();
  const areas = data?.data ?? [];
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform w-60 bg-white border-r border-slate-200 flex flex-col h-full lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-4 py-5 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-1">System</p>
        <p className="text-[15px] font-bold text-slate-800">ParkHub Digital Twin</p>
      </div>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">Parking Zones</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => navigate(`/area/${area.id}/dashboard`)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-2.5 transition-all ${
              area.id === currentId
                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${area.area_json ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-[13px] leading-tight truncate flex-1">{area.name}</span>
            <span className={`text-[10px] flex-shrink-0 ${area.id === currentId ? 'text-blue-400' : 'text-slate-300'}`}>#{area.id}</span>
          </button>
        ))}
      </div>
    </aside>
    </>
  );
};

// ─── Event Entry ──────────────────────────────────────────────────────────────
const EventEntry = ({
  slot, status, time,
}: { slot: string; status: 'Occupied' | 'Available'; time: string }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${status === 'Occupied' ? 'bg-red-400' : 'bg-green-400'}`} />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-slate-700">Slot {slot}</p>
      <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
        status === 'Occupied'
          ? 'bg-red-50 text-red-600 border border-red-100'
          : 'bg-green-50 text-green-600 border border-green-100'
      }`}>{status}</span>
    </div>
    <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{time}</span>
  </div>
);

// ─── Module Card ─────────────────────────────────────────────────────────────
const ModuleCard = ({
  section, title, subtitle, action, children, className = '',
}: {
  section: string; title: string; subtitle?: string;
  action?: React.ReactNode; children: React.ReactNode; className?: string;
}) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
    <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
      <div>
        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-0.5">{section}</p>
        <h3 className="text-[14px] font-semibold text-slate-800 leading-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-3 flex-shrink-0">{action}</div>}
    </div>
    <div className="flex-1 min-h-0 p-4">{children}</div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const JSX = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areaId = Number(id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: areaData, isLoading: isLoadingArea } = useAreaDetail(areaId);
  const areaName = areaData?.data?.name ?? `Area #${areaId}`;

  const [params] = useState<AnalyticsParams>({
    from: daysAgoIso(7),
    to: toIso(new Date()),
    granularity: 'hour',
  });

  const summary  = useAnalyticsSummary(areaId, params);
  const timeline = useOccupancyTimeline(areaId, params);
  const heatmap  = useSlotHeatmap(areaId, params);
  const arrival  = useArrivalRate(areaId, params);

  const isAnyLoading = summary.isLoading || timeline.isLoading || heatmap.isLoading || arrival.isLoading;

  const refetchAll = () => { summary.refetch(); timeline.refetch(); heatmap.refetch(); arrival.refetch(); };

  // Mocked recent system events (static for journal figure clarity)
  const events = [
    { id: 1, slot: '#A12', status: 'Occupied'  as const, time: '10 min ago' },
    { id: 2, slot: '#B04', status: 'Available' as const, time: '14 min ago' },
    { id: 3, slot: '#A08', status: 'Available' as const, time: '22 min ago' },
    { id: 4, slot: '#C19', status: 'Occupied'  as const, time: '45 min ago' },
    { id: 5, slot: '#B11', status: 'Available' as const, time: '1 hr ago'   },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <FiMenu size={20} />
          </button>
          <button onClick={() => navigate(`/area/${id}`)} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Back
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em]">Executive Overview</p>
            <h1 className="text-[18px] font-bold text-slate-800 leading-tight truncate">
              {isLoadingArea ? 'Loading…' : `${areaName} — Dashboard`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Last 7 Days · Hourly Granularity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetchAll} disabled={isAnyLoading}
            className="text-[12px] text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 bg-white"
          >
            {isAnyLoading ? 'Loading…' : '↻ Refresh'}
          </button>
          <button
            onClick={() => navigate(`/area/${id}/analytics`)}
            className="px-3 py-2 text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            Full Analytics ↗
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <AreaSidebar currentId={areaId} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-5 py-5 flex flex-col gap-4 min-w-0">

          {/* ── KPI Strip ── */}
          <section>
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-2.5">
              Section A — Key Performance Indicators
            </p>
            <KpiCards
              data={summary.data?.data}
              timeline={timeline.data?.data}
              isLoading={summary.isLoading || timeline.isLoading}
            />
          </section>

          {/* ── Charts Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

            {/* Left column — Occupancy Trend + Arrival Rate */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <ModuleCard
                section="Section B — Live Data Feed"
                title="Occupancy Trend"
                subtitle="Hourly occupancy rate across the facility · last 7 days"
                className="flex-1"
              >
                <OccupancyChart
                  data={timeline.data?.data}
                  isLoading={timeline.isLoading}
                  granularity="hour"
                />
              </ModuleCard>

              <ModuleCard
                section="Section C — Traffic Analysis"
                title="Arrival Rate Distribution"
                subtitle="Average vehicle arrivals by hour of day"
                className="flex-1"
              >
                <ArrivalChart
                  data={arrival.data?.data}
                  isLoading={arrival.isLoading}
                  granularity="hour"
                />
              </ModuleCard>
            </div>

            {/* Right column — Heatmap + Events */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <ModuleCard
                section="Section D — Analytics"
                title="Slot Utilization Heatmap"
                subtitle="Occupancy frequency per parking slot"
                className="flex-1"
              >
                <SlotHeatmap
                  data={heatmap.data?.data}
                  isLoading={heatmap.isLoading}
                />
              </ModuleCard>

              <ModuleCard
                section="Section E — System Events"
                title="Recent Event Log"
                subtitle="Latest status change events"
                action={
                  <button
                    onClick={() => navigate(`/area/${id}`)}
                    className="text-[11px] font-medium text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    View All →
                  </button>
                }
                className="flex-1"
              >
                <div className="flex flex-col">
                  {events.map((evt) => (
                    <EventEntry key={evt.id} slot={evt.slot} status={evt.status} time={evt.time} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-3">
                  Showing 5 most recent status changes
                </p>
              </ModuleCard>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default { JSX, i18n };
