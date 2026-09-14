import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrivalRateResponse } from '../../../global/hook/useAnalytics';

interface Props {
  data: ArrivalRateResponse | undefined;
  isLoading: boolean;
  granularity: 'hour' | 'day' | 'week';
}

const hourLabel = (h: number) => {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-slate-600 font-semibold mb-1">{hourLabel(label)}</p>
      <p className="text-blue-700 font-semibold">Avg Arrivals: {payload[0].value.toFixed(1)}</p>
      <p className="text-slate-400 mt-0.5">average across days in range</p>
    </div>
  );
};

// ─── Transform: group arrivals by hour of day, average across days ──────────
const buildHourlyAverage = (rawData: ArrivalRateResponse['data']) => {
  const buckets: Record<number, { total: number; days: Set<string> }> = {};

  rawData.forEach((point) => {
    const baseDate = new Date(point.timestamp.includes('Z') || point.timestamp.includes('+') ? point.timestamp : point.timestamp + 'Z');
    const d = new Date(baseDate.getTime() + 7 * 60 * 60 * 1000);
    const hourString = d.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
    const hour = parseInt(hourString, 10);
    const dayKey = d.toLocaleDateString('en-GB', { timeZone: 'UTC' });

    if (!buckets[hour]) buckets[hour] = { total: 0, days: new Set() };
    buckets[hour].total += point.arrivals;
    buckets[hour].days.add(dayKey);
  });

  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    avgArrivals: buckets[h]
      ? +(buckets[h].total / buckets[h].days.size).toFixed(2)
      : 0,
  }));
};

const ArrivalChart = ({ data, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-64">
        <div className="h-3.5 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    );
  }

  const chartData = buildHourlyAverage(data?.data ?? []);
  const maxVal = Math.max(...chartData.map((d) => d.avgArrivals), 0);

  // Top 3 peak arrival hours
  const top3 = new Set(
    [...chartData]
      .sort((a, b) => b.avgArrivals - a.avgArrivals)
      .slice(0, 3)
      .map((d) => d.hour),
  );

  const hasData = chartData.some((d) => d.avgArrivals > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-0.5">Arrival Rate Distribution</h3>
      <p className="text-[11px] text-slate-400 mb-4">
        Average new arrivals per hour of day · top 3 peak hours highlighted
      </p>
      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          No data for selected range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="hour"
              tickFormatter={hourLabel}
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={true}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
            <Bar dataKey="avgArrivals" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={top3.has(entry.hour) ? '#3B82F6' : '#93C5FD'}
                  fillOpacity={
                    entry.avgArrivals === maxVal ? 1 : top3.has(entry.hour) ? 0.9 : 0.65
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ArrivalChart;
