import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { SlotHeatmapResponse } from '../../../global/hook/useAnalytics';

interface Props { data: SlotHeatmapResponse | undefined; isLoading: boolean; }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-slate-800 font-semibold mb-1.5">{d.slotName}</p>
      <p className="text-red-600">Occupancy: {(d.occupancyRate * 100).toFixed(1)}%</p>
      <p className="text-blue-600">Occupied events: {d.totalOccupied}</p>
      <p className="text-slate-400">Empty events: {d.totalEmpty}</p>
    </div>
  );
};

const occupancyColor = (rate: number): string => {
  if (rate >= 0.75) return '#EF4444';
  if (rate >= 0.5)  return '#F97316';
  if (rate >= 0.25) return '#EAB308';
  return '#22C55E';
};

const SlotHeatmap = ({ data, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
        <div className="h-3.5 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-64 bg-slate-100 rounded" />
      </div>
    );
  }
  const slots = [...(data?.slots ?? [])].sort((a, b) => b.occupancyRate - a.occupancyRate);
  const chartHeight = Math.max(220, slots.length * 36);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-0.5">Slot Utilization Heatmap</h3>
      <p className="text-[11px] text-slate-400 mb-1">Occupancy rate per slot, sorted highest → lowest</p>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { color: '#EF4444', label: '≥ 75%' },
          { color: '#F97316', label: '50–75%' },
          { color: '#EAB308', label: '25–50%' },
          { color: '#22C55E', label: '< 25%' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
      {slots.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data for selected range</div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart layout="vertical" data={slots} margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="slotName" tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
              <Bar dataKey="occupancyRate" radius={[0, 4, 4, 0]}
                label={{ position: 'right', formatter: (v: number) => `${(v * 100).toFixed(1)}%`, fill: '#64748B', fontSize: 10 }}>
                {slots.map((entry, index) => (
                  <Cell key={index} fill={occupancyColor(entry.occupancyRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SlotHeatmap;
