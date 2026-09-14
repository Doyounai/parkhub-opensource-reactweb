interface CycleSubmitBarProps {
  stats: { total: number; free: number; occupied: number };
  cameraCount: number;
  uploadedCount: number;
  onSubmit: () => void;
  submitting: boolean;
}

export default function CycleSubmitBar({
  stats,
  cameraCount,
  uploadedCount,
  onSubmit,
  submitting,
}: CycleSubmitBarProps) {
  const readyToSubmit = stats.total > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-2.5 bg-panel border-t border-border shrink-0">
      <div className="flex items-center gap-5">
        <StatChip label="TOTAL" value={stats.total} color="var(--accent)" />
        <StatChip label="FREE" value={stats.free} color="var(--green)" />
        <StatChip label="OCCUPIED" value={stats.occupied} color="var(--red)" />
        <div className="w-px h-7 bg-border" />
        <StatChip
          label="IMAGES"
          value={`${uploadedCount}/${cameraCount}`}
          color={
            uploadedCount === cameraCount && cameraCount > 0
              ? 'var(--green)'
              : 'var(--muted)'
          }
        />
      </div>

      <div className="flex items-center gap-4">
        {stats.total === 0 && (
          <span className="text-xs text-muted font-mono">
            No slots in layout — draw one in the Editor first.
          </span>
        )}
        <button
          className={`flex items-center gap-2 px-7 py-2.5 bg-accent/10 text-accent border border-accent/35 rounded-md text-sm font-bold tracking-wide font-rajdhani transition-all whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed
            ${submitting ? 'opacity-70 cursor-wait' : 'hover:bg-accent/18 hover:border-accent hover:shadow-[0_0_16px_rgba(0,229,255,0.15)]'}`}
          onClick={onSubmit}
          disabled={!readyToSubmit || submitting}
        >
          {submitting ? (
            <>
              <span className="inline-block animate-spin">⟳</span> Saving…
            </>
          ) : (
            <>
              <span>⊕</span> Submit Cycle
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-px min-w-[36px]">
      <span className="font-mono text-xl font-bold leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-[9px] tracking-widest text-muted font-mono">{label}</span>
    </div>
  );
}
