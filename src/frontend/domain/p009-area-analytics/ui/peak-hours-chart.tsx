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
import { PeakHoursResponse } from '../../../global/hook/useAnalytics';

interface Props {
  data: PeakHoursResponse | undefined;
  isLoading: boolean;
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
      <p className="text-blue-700">Avg Occupancy: {(payload[0].value * 100).toFixed(1)}%</p>
    </div>
  );
};

const PeakHoursChart = ({ data, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-64">
        <div className="h-3.5 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    );
  }

  // Build full 24h array, fill missing hours with 0
  const rawMap: Record<number, number> = {};
  (data?.data ?? []).forEach((d) => {
    const shiftedHour = (d.hour + 7) % 24;
    rawMap[shiftedHour] = d.avgOccupancyRate;
  });
  const chartData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    avgOccupancyRate: rawMap[h] ?? 0,
  }));

  // Find top 3 peak hours
  const sorted = [...chartData].sort((a, b) => b.avgOccupancyRate - a.avgOccupancyRate);
  const top3 = new Set(sorted.slice(0, 3).map((d) => d.hour));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-0.5">Peak Hours Analysis</h3>
      <p className="text-[11px] text-slate-400 mb-1">
        Average occupancy by hour of day · top 3 peak hours highlighted
      </p>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Peak hours
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" /> Other hours
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="hour"
            tickFormatter={hourLabel}
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 1]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
          <Bar dataKey="avgOccupancyRate" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={top3.has(entry.hour) ? '#3B82F6' : '#BFDBFE'}
                fillOpacity={top3.has(entry.hour) ? 1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PeakHoursChart;
