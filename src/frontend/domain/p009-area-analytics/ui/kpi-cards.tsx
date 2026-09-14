import {
  AnalyticsSummaryResponse,
  OccupancyTimelineResponse,
} from '../../../global/hook/useAnalytics';

interface Props {
  data: AnalyticsSummaryResponse | undefined;
  timeline: OccupancyTimelineResponse | undefined;
  isLoading: boolean;
}

const fmt = (v: number, decimals = 1) => v.toFixed(decimals);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const dur = (v: number) => {
  const h = Math.floor(v / 60);
  const m = Math.round(v % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Shift UTC timestamp (+0) to Thai time (+7) for display
const toThaiStr = (iso: string) => {
  if (!iso) return '';
  const baseDate = new Date(iso.includes('Z') || iso.includes('+') ? iso : iso + 'Z');
  const d = new Date(baseDate.getTime() + 7 * 60 * 60 * 1000);
  return d.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
};

// Semantic color for occupancy rate — status only
const occupancyColor = (rate: number) => {
  if (rate >= 0.85) return 'text-red-600';
  if (rate >= 0.6) return 'text-amber-600';
  return 'text-green-600';
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  label,
  value,
  sub,
  valueClass = 'text-blue-700',
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) => (
  <div className="flex-1 min-w-[148px] bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
      {label}
    </p>
    <p className={`text-[22px] font-bold leading-tight ${valueClass}`}>{value}</p>
    {sub && <p className="text-[11px] text-slate-400 leading-tight">{sub}</p>}
  </div>
);

const SkeletonCard = () => (
  <div className="flex-1 min-w-[148px] bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
    <div className="h-2.5 bg-slate-100 rounded w-2/3 mb-3" />
    <div className="h-6 bg-slate-100 rounded w-1/2 mb-2" />
    <div className="h-2 bg-slate-100 rounded w-3/4" />
  </div>
);

// ── KpiCards ─────────────────────────────────────────────────────────────────
const KpiCards = ({ data, timeline, isLoading }: Props) => {
  if (isLoading || !data) {
    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const points = timeline?.data ?? [];
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const latestRate = latestPoint?.occupancyRate ?? 0;

  return (
    <div className="flex flex-wrap gap-3">
      {/* Current Occupancy — semantic status color */}
      <KpiCard
        label="Current Occupancy"
        value={latestPoint ? pct(latestRate) : '—'}
        sub={latestPoint ? `As of ${toThaiStr(latestPoint.timestamp)}` : 'No recent data'}
        valueClass={occupancyColor(latestRate)}
      />

      <KpiCard
        label="Total Sessions"
        value={data.totalSessions.toLocaleString()}
        sub="records in range"
      />

      <KpiCard
        label="Avg Occupancy"
        value={pct(data.avgOccupancyRate)}
        sub="across range"
      />

      <KpiCard
        label="Peak Occupancy"
        value={pct(data.peakOccupancyRate)}
        sub={`at ${toThaiStr(data.peakTimestamp)}`}
      />

      <KpiCard
        label="Total Arrivals"
        value={data.totalArrivals.toLocaleString()}
        sub="inflow count"
      />

      <KpiCard
        label="Avg Duration"
        value={dur(data.avgParkingDurationMinutes)}
        sub={`${fmt(data.avgParkingDurationMinutes)} min avg`}
      />

      {data.mostUsedSlot && (
        <KpiCard
          label="Most Used Slot"
          value={data.mostUsedSlot.slotName}
          sub={`${pct(data.mostUsedSlot.occupancyRate)} utilization`}
          valueClass="text-green-700"
        />
      )}

      {/* <KpiCard
        label="Least Used Slot"
        value={data.leastUsedSlot.slotName}
        sub={`${pct(data.leastUsedSlot.occupancyRate)} utilization`}
        valueClass="text-slate-600"
      />

      <KpiCard
        label="Total Slots"
        value={data.totalSlots.toLocaleString()}
        sub="monitored spaces"
        valueClass="text-slate-700"
      /> */}
    </div>
  );
};

export default KpiCards;
