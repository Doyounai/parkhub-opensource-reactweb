import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AvgParkingDurationResponse } from '../../../global/hook/useAnalytics';

interface Props { data: AvgParkingDurationResponse | undefined; isLoading: boolean; }

const dur = (v: number) => {
  const h = Math.floor(v / 60);
  const m = Math.round(v % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-slate-800 font-semibold mb-1.5">{d.slotName}</p>
      <p className="text-blue-600">Avg: {dur(d.avgDurationMinutes)} ({d.avgDurationMinutes.toFixed(1)} min)</p>
      <p className="text-green-600">Min: {dur(d.minDurationMinutes)}</p>
      <p className="text-red-600">Max: {dur(d.maxDurationMinutes)}</p>
      <p className="text-slate-400">Sessions: {d.parkingCount}</p>
    </div>
  );
};

const DurationChart = ({ data, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
        <div className="h-3.5 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-72 bg-slate-100 rounded" />
      </div>
    );
  }

  const avgArea = data?.avgDurationMinutes ?? 0;
  const slots = [...(data?.slots ?? [])].sort((a, b) => b.avgDurationMinutes - a.avgDurationMinutes);
  const chartHeight = Math.max(220, slots.length * 40);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-0.5">Avg Parking Duration</h3>
      <p className="text-[11px] text-slate-400 mb-4">How long vehicles park on average, per slot</p>

      {/* Area-wide KPI */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-3 mb-6 inline-flex flex-col gap-0.5">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.08em] font-semibold">Area-wide Average</p>
        <p className="text-[28px] font-bold text-blue-700 leading-tight">{dur(avgArea)}</p>
        <p className="text-[11px] text-slate-400">{avgArea.toFixed(1)} minutes</p>
      </div>

      {slots.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
          No slot data for selected range
        </div>
      ) : (
        <>
          <p className="text-[11px] text-slate-400 mb-3">Per-slot breakdown (min / avg / max)</p>
          <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart layout="vertical" data={slots} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}m`}
                  tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="slotName"
                  tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#64748B', paddingTop: 8 }}
                  formatter={(value) =>
                    value === 'minDurationMinutes' ? 'Min'
                    : value === 'avgDurationMinutes' ? 'Avg'
                    : 'Max'
                  }
                />
                <Bar dataKey="minDurationMinutes" name="Min" fill="#86EFAC" radius={[0, 2, 2, 0]} fillOpacity={0.8} />
                <Bar dataKey="avgDurationMinutes" name="Avg" fill="#3B82F6" radius={[0, 2, 2, 0]} />
                <Bar dataKey="maxDurationMinutes" name="Max" fill="#FCA5A5" radius={[0, 2, 2, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default DurationChart;
