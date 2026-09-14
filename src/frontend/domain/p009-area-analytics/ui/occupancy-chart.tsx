import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { OccupancyTimelinePoint, OccupancyTimelineResponse } from '../../../global/hook/useAnalytics';

interface Props {
  data: OccupancyTimelineResponse | undefined;
  isLoading: boolean;
  granularity: 'hour' | 'day' | 'week';
}

// Distinct but muted palette for multi-day lines (print-safe)
const DAY_COLORS = [
  '#3B82F6', // blue-500
  '#0EA5E9', // sky-500
  '#6366F1', // indigo-500
  '#8B5CF6', // violet-500
  '#14B8A6', // teal-500
  '#64748B', // slate-500
  '#0891B2', // cyan-600
];

// ─── Multi-day transform (hourly granularity) ────────────────────────────────
const buildMultiDayData = (points: OccupancyTimelinePoint[]) => {
  const byDate: Record<string, Record<string, number>> = {};
  const allHours = new Set<string>();
  const dateOrder: string[] = [];

  points.forEach((p) => {
    const baseDate = new Date(p.timestamp.includes('Z') || p.timestamp.includes('+') ? p.timestamp : p.timestamp + 'Z');
    const d = new Date(baseDate.getTime() + 7 * 60 * 60 * 1000);
    const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Bangkok' });
    const hour = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });

    if (!byDate[dateKey]) {
      byDate[dateKey] = {};
      dateOrder.push(dateKey);
    }
    byDate[dateKey][hour] = +(p.occupancyRate * 100).toFixed(2);
    allHours.add(hour);
  });

  const hours = [...allHours].sort();
  const chartData = hours.map((hour) => {
    const row: Record<string, any> = { hour };
    dateOrder.forEach((date) => { row[date] = byDate[date]?.[hour] ?? null; });
    return row;
  });

  return { chartData, days: dateOrder };
};

// ─── Tooltips ────────────────────────────────────────────────────────────────
const SingleTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-slate-500 mb-1.5">
        {new Date(new Date(label).getTime() + 7 * 60 * 60 * 1000).toLocaleString('en-GB', { timeZone: 'UTC' })}
      </p>
      <p className="text-blue-700 font-semibold">Occupancy: {(d.occupancyRate * 100).toFixed(1)}%</p>
      <p className="text-slate-600">Occupied: {d.occupiedCount} / {d.totalSlots} slots</p>
      <p className="text-slate-400">Sessions: {d.sessionCount}</p>
    </div>
  );
};

const MultiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg min-w-[140px]">
      <p className="text-slate-700 font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke }} className="mb-0.5">
          {p.dataKey}: {p.value != null ? `${p.value.toFixed(1)}%` : '—'}
        </p>
      ))}
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const OccupancyChart = ({ data, isLoading, granularity }: Props) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-64">
        <div className="h-3.5 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    );
  }

  const rawPoints = data?.data ?? [];

  // ── Multi-line hourly view ───────────────────────────────────────────────
  if (granularity === 'hour') {
    const { chartData, days } = buildMultiDayData(rawPoints);

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-0.5">Occupancy Timeline</h3>
        <p className="text-[11px] text-slate-400 mb-4">Hourly occupancy by day — each line represents one day</p>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            No data for selected range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<MultiTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748B', paddingTop: 8 }} />
              {days.map((day, i) => (
                <Line
                  key={day}
                  type="monotone"
                  dataKey={day}
                  stroke={DAY_COLORS[i % DAY_COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }

  // ── Single-line day/week view ─────────────────────────────────────────────
  const chartData = rawPoints.map((d) => ({
    ...d,
    ratePercent: +(d.occupancyRate * 100).toFixed(2),
  }));

  const tickLabel = (t: string) =>
    new Date(new Date(t).getTime() + 7 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-0.5">Occupancy Timeline</h3>
      <p className="text-[11px] text-slate-400 mb-4">Average occupancy rate over time</p>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          No data for selected range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="occGradientLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={tickLabel}
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<SingleTooltip />} />
            <Area
              type="monotone"
              dataKey="ratePercent"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#occGradientLight)"
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default OccupancyChart;
