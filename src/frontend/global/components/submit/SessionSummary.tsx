// import { ParkTwinSession, Layout } from '../types';
import { ParkTwinSession, Layout } from '../../../../types/types';

interface SessionSummaryProps {
  session: ParkTwinSession | null;
  layout: Layout;
  onNewCycle: () => void;
}

export default function SessionSummary({
  session,
  layout,
  onNewCycle,
}: SessionSummaryProps) {
  if (!session) return null;

  const { stats, slotStatuses, cameraImages, timestamp } = session;
  const pct = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
  const time = new Date(timestamp).toLocaleString();

  // Group slots by status
  const occupiedSlots = layout.slots.filter((s) => slotStatuses[s.id] === 'occupied');
  const freeSlots = layout.slots.filter((s) => slotStatuses[s.id] === 'free');

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-5 max-w-[860px] mx-auto w-full">
      <div className="flex items-center gap-4 p-4 px-5 bg-green/6 border border-green/20 rounded-lg animate-[heroIn_0.4s_ease]">
        <div className="w-10 h-10 rounded-full bg-green/12 border-2 border-green text-green text-[18px] flex items-center justify-center shrink-0">
          ✓
        </div>
        <div className="flex flex-col">
          <div className="text-[18px] font-bold text-text tracking-wide">
            Cycle Submitted
          </div>
          <div className="text-[11px] font-mono text-muted mt-0.5">{time}</div>
        </div>
      </div>

      {/* Occupancy gauge */}
      <div className="flex gap-6 items-center bg-panel border border-border rounded-lg p-5 px-6">
        <div className="shrink-0">
          <svg viewBox="0 0 160 90" className="w-[160px] h-[90px] overflow-visible">
            {/* Background arc */}
            <path
              d="M 15 85 A 65 65 0 0 1 145 85"
              fill="none"
              stroke="var(--border)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 15 85 A 65 65 0 0 1 145 85"
              fill="none"
              stroke={pct > 70 ? 'var(--red)' : pct > 40 ? '#ffdd33' : 'var(--green)'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 204} 204`}
              className="transition-[stroke-dasharray] duration-[0.6s] ease-in-out"
            />
            <text
              x="80"
              y="78"
              textAnchor="middle"
              className="font-mono text-[22px] fill-text font-bold"
            >
              {pct}%
            </text>
            <text
              x="80"
              y="92"
              textAnchor="middle"
              className="font-mono text-[7px] fill-muted tracking-widest"
            >
              OCCUPIED
            </text>
          </svg>
        </div>

        <div className="flex gap-7 flex-wrap">
          <SummaryCount label="TOTAL SLOTS" value={stats.total} color="var(--accent)" />
          <SummaryCount label="OCCUPIED" value={stats.occupied} color="var(--red)" />
          <SummaryCount label="FREE" value={stats.free} color="var(--green)" />
          <SummaryCount
            label="CAMERAS"
            value={Object.keys(cameraImages).length}
            color="var(--muted)"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Slot breakdown */}
        <div className="bg-panel border border-border rounded-lg p-3.5 px-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted font-mono uppercase">
            <span className="w-[7px] h-[7px] rounded-full shrink-0 bg-red" />
            OCCUPIED SLOTS ({occupiedSlots.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {occupiedSlots.length === 0 ? (
              <span className="text-xs text-muted font-mono">None</span>
            ) : (
              occupiedSlots.map((s) => (
                <span
                  key={s.id}
                  className="font-mono text-xs font-bold px-3 py-[3px] rounded-full border tracking-wide text-red border-red/40 bg-red/8"
                >
                  {s.label}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-panel border border-border rounded-lg p-3.5 px-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted font-mono uppercase">
            <span className="w-[7px] h-[7px] rounded-full shrink-0 bg-green" />
            FREE SLOTS ({freeSlots.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {freeSlots.length === 0 ? (
              <span className="text-xs text-muted font-mono">None</span>
            ) : (
              freeSlots.map((s) => (
                <span
                  key={s.id}
                  className="font-mono text-xs font-bold px-3 py-[3px] rounded-full border tracking-wide text-green border-green/40 bg-green/8"
                >
                  {s.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Camera images */}
        {Object.keys(cameraImages).length > 0 && (
          <div className="bg-panel border border-border rounded-lg p-3.5 px-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted font-mono uppercase">
              <span className="w-[7px] h-[7px] rounded-full shrink-0 bg-accent" />
              CAMERA FRAMES ({Object.keys(cameraImages).length})
            </div>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(cameraImages).map(([camId, img]) => (
                <div key={camId} className="flex flex-col gap-1 w-[120px]">
                  {img.dataUrl && (
                    <img
                      src={img.dataUrl}
                      alt={`Camera ${camId}`}
                      className="w-[120px] h-20 object-cover rounded border border-border"
                    />
                  )}
                  <div className="font-mono text-[11px] text-accent font-bold">
                    CAM #{camId}
                  </div>
                  <div className="text-[10px] text-muted font-mono truncate">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pb-2">
        <button
          className="flex items-center gap-2 py-[11px] px-8 bg-accent/8 text-accent border border-accent/30 rounded-md text-sm font-bold tracking-wide font-rajdhani transition-all hover:bg-accent/15 hover:border-accent hover:shadow-[0_0_16px_rgba(0,229,255,0.12)]"
          onClick={onNewCycle}
        >
          ⊕ Start New Cycle
        </button>
      </div>
      <style>{`
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(-8px) }
          to   { opacity: 1; transform: none }
        }
      `}</style>
    </div>
  );
}

function SummaryCount({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-[3px]">
      <div className="font-mono text-[28px] font-bold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] tracking-[0.15em] text-muted font-mono uppercase">
        {label}
      </div>
    </div>
  );
}
