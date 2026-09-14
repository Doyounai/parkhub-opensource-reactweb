import './index.scss';

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

import { I18nDomainResource } from './i18n';
import { AnalyticsParams } from '../../global/hook/useAnalytics';
import {
  useAnalyticsSummary,
  useOccupancyTimeline,
  useArrivalRate,
  useAvgParkingDuration,
  useSlotHeatmap,
  usePeakHours,
} from '../../global/hook/useAnalytics';
import { useAreaList, useAreaDetail } from '../../global/hook/useArea';

import KpiCards from './ui/kpi-cards';
import OccupancyChart from './ui/occupancy-chart';
import ArrivalChart from './ui/arrival-chart';
import PeakHoursChart from './ui/peak-hours-chart';
import SlotHeatmap from './ui/slot-heatmap';
import DurationChart from './ui/duration-chart';

const domainName = 'analytics';
const i18n = I18nDomainResource(domainName);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toIso = (d: Date) => d.toISOString();
const toPlus7InputString = (d: Date) => {
  const offsetDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return offsetDate.toISOString().slice(0, 16);
};
const nowIso = () => toIso(new Date());
const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIso(d);
};

type Preset = '7d' | '30d' | '90d' | 'custom';
interface PresetConfig { label: string; days: number; granularity: 'hour' | 'day' | 'week'; description: string; }

const PRESETS: Record<Exclude<Preset, 'custom'>, PresetConfig> = {
  '7d':  { label: 'Last 7 Days',  days: 7,  granularity: 'hour', description: 'Hourly view' },
  '30d': { label: 'Last 30 Days', days: 30, granularity: 'week', description: 'Weekly view' },
  '90d': { label: 'Last 90 Days', days: 90, granularity: 'week', description: 'Weekly view' },
};

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
        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-1">Parking Zones</p>
        <p className="text-[13px] font-bold text-slate-800">ParkHub Digital Twin</p>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => navigate(`/area/${area.id}/analytics`)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-2.5 transition-all ${
              area.id === currentId
                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${area.area_json ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-[13px] leading-tight truncate">{area.name}</span>
            <span className={`ml-auto text-[10px] font-medium flex-shrink-0 ${area.id === currentId ? 'text-blue-400' : 'text-slate-300'}`}>#{area.id}</span>
          </button>
        ))}
      </div>
    </aside>
    </>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const JSX = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areaId = Number(id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [preset, setPreset] = useState<Preset>('7d');
  const [params, setParams] = useState<AnalyticsParams>({
    from: daysAgoIso(7),
    to: nowIso(),
    granularity: 'hour',
  });

  const [customFrom, setCustomFrom] = useState(toPlus7InputString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [customTo, setCustomTo] = useState(toPlus7InputString(new Date()));
  const [customGranularity, setCustomGranularity] = useState<'hour' | 'day' | 'week'>('day');

  const { data: areaData } = useAreaDetail(areaId);
  const areaName = areaData?.data?.name ?? `Area #${areaId}`;

  const summary   = useAnalyticsSummary(areaId, params);
  const timeline  = useOccupancyTimeline(areaId, params);
  const arrival   = useArrivalRate(areaId, params);
  const duration  = useAvgParkingDuration(areaId, params);
  const heatmap   = useSlotHeatmap(areaId, params);
  const peakHours = usePeakHours(areaId, params);

  const refetchAll = useCallback(() => {
    summary.refetch(); timeline.refetch(); arrival.refetch();
    duration.refetch(); heatmap.refetch(); peakHours.refetch();
  }, [summary, timeline, arrival, duration, heatmap, peakHours]);

  const handlePreset = (key: Exclude<Preset, 'custom'>) => {
    const cfg = PRESETS[key];
    setPreset(key);
    setParams({ from: daysAgoIso(cfg.days), to: nowIso(), granularity: cfg.granularity });
  };

  const handleCustomApply = () => {
    const fromDate = new Date(customFrom + ':00+07:00');
    const toDate   = new Date(customTo   + ':00+07:00');
    setPreset('custom');
    setParams({ from: fromDate.toISOString(), to: toDate.toISOString(), granularity: customGranularity });
  };

  const isAnyLoading = summary.isLoading || timeline.isLoading || arrival.isLoading ||
    duration.isLoading || heatmap.isLoading || peakHours.isLoading;

  const fmtDate = (iso: string) => iso
    ? new Date(new Date(iso.includes('Z') || iso.includes('+') ? iso : iso + 'Z').getTime() + 7 * 60 * 60 * 1000)
        .toLocaleDateString('en-GB', { timeZone: 'UTC' })
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col h-screen overflow-hidden">
      {/* ── Sticky Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 z-50">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <FiMenu size={20} />
            </button>
            <button
              onClick={() => navigate(`/area/${id}`)}
              className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
            >
              ← Back
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em]">
                Analytics Dashboard
              </p>
              <h1 className="text-[18px] font-bold text-slate-800 leading-tight truncate">
                {areaName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {fmtDate(params.from)} – {fmtDate(params.to)} ·{' '}
                <span className="capitalize font-medium text-slate-500">{params.granularity} granularity</span>
              </p>
            </div>
          </div>
          <button
            onClick={refetchAll}
            disabled={isAnyLoading}
            className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 bg-white whitespace-nowrap"
          >
            {isAnyLoading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <AreaSidebar currentId={areaId} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 flex flex-col gap-5 min-w-0">

          {/* ── Date Range Filter ── */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-3">Date Range</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(Object.keys(PRESETS) as Exclude<Preset, 'custom'>[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
                    preset === key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {PRESETS[key].label}
                  <span className={`ml-1.5 text-[10px] ${preset === key ? 'text-blue-200' : 'text-slate-400'}`}>
                    ({PRESETS[key].description})
                  </span>
                </button>
              ))}
              <button
                onClick={() => setPreset('custom')}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
                  preset === 'custom'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                Custom Range
              </button>
            </div>

            {preset === 'custom' && (
              <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500 font-medium">From</label>
                  <input
                    type="datetime-local" value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500 font-medium">To</label>
                  <input
                    type="datetime-local" value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500 font-medium">Granularity</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200">
                    {(['hour', 'day', 'week'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setCustomGranularity(g)}
                        className={`px-3 py-1.5 text-[12px] capitalize transition-all ${
                          customGranularity === g
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCustomApply}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-lg transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </section>

          {/* ── KPI Cards ── */}
          <KpiCards
            data={summary.data?.data}
            timeline={timeline.data?.data}
            isLoading={summary.isLoading || timeline.isLoading}
          />

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <OccupancyChart data={timeline.data?.data} isLoading={timeline.isLoading} granularity={params.granularity ?? 'day'} />
            <ArrivalChart   data={arrival.data?.data}  isLoading={arrival.isLoading}  granularity={params.granularity ?? 'day'} />
          </div>

          {/* ── Charts Row 2 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <PeakHoursChart data={peakHours.data?.data} isLoading={peakHours.isLoading} />
            <SlotHeatmap    data={heatmap.data?.data}   isLoading={heatmap.isLoading}   />
          </div>

          {/* ── Full-width Duration Chart ── */}
          <DurationChart data={duration.data?.data} isLoading={duration.isLoading} />

        </main>
      </div>
    </div>
  );
};

export default { JSX, i18n };
