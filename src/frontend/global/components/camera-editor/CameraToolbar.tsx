import { DRAW_MODES } from '../../hook/camera/useCameraDrawing';

interface Camera {
  id: string | number;
  name?: string;
  area_id?: string | number;
}

interface Zone {
  id: string | number;
  color: string;
  slotLabel: string;
}

interface CameraToolbarProps {
  camera: Camera | null;
  drawMode: string;
  zones: Zone[];
  onSaveSlot: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onDeleteZone: (id: string | number) => void;
  onClearAll: () => void;
}

export default function CameraToolbar({
  camera,
  drawMode,
  zones,
  onSaveSlot,
  onStartDrawing,
  onCancelDrawing,
  onDeleteZone,
  onClearAll,
}: CameraToolbarProps) {
  const isDrawing = drawMode === DRAW_MODES.DRAWING;

  return (
    <aside className="w-[210px] min-w-[210px] bg-panel border-r border-border-main flex flex-col overflow-y-auto">
      {/* Camera info */}
      <div className="flex items-center gap-2.5 p-3.5">
        <div className="w-9 h-9 rounded-md bg-accent/10 border border-accent/25 text-accent text-[10px] font-bold tracking-[0.1em] flex items-center justify-center shrink-0 font-mono">
          CAM
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-text-main whitespace-nowrap overflow-hidden text-ellipsis">
            {camera?.name ?? '—'}
          </div>
          <div className="text-[10px] text-muted-main font-mono mt-0.5">
            ID #{camera?.id} · Area {camera?.area_id}
          </div>
        </div>
      </div>

      <div className="h-px bg-border-main mx-3.5" />

      {/* Draw zone */}
      <div className="p-[10px_14px] flex flex-col gap-1.5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-muted-main uppercase font-mono flex items-center gap-1.5">
          ZONE DRAWING
        </div>
        <button
          className={`flex items-center gap-2 p-[8px_12px] rounded-md text-[13px] font-semibold tracking-[0.04em] w-full border transition-all duration-120 text-left ${
            isDrawing
              ? 'bg-accent-2/10 border-accent-2/30 text-accent-2'
              : 'bg-accent/8 border-accent/20 text-accent hover:bg-accent/15'
          }`}
          onClick={isDrawing ? onCancelDrawing : onStartDrawing}
        >
          <span className="text-[15px]">{isDrawing ? '✕' : '⬡'}</span>
          {isDrawing ? 'Cancel Drawing' : 'Draw Zone'}
        </button>
        {isDrawing && (
          <div className="text-[11px] text-accent-2 leading-relaxed bg-accent-2/5 border border-accent-2/20 rounded-md p-[6px_10px] font-mono">
            Click <strong className="text-white">4 corner points</strong> on the camera
            image to define a parking zone.
          </div>
        )}
      </div>

      <div className="h-px bg-border-main mx-3.5" />

      {/* Zone list */}
      <div className="p-[10px_14px] flex flex-col gap-1.5 flex-1 min-height-0">
        <div className="text-[10px] font-bold tracking-[0.15em] text-muted-main uppercase font-mono flex items-center gap-1.5">
          MAPPED ZONES{' '}
          <span className="bg-accent/12 text-accent rounded-full px-1.75 py-0.25 text-[10px]">
            {zones.length}
          </span>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[300px]">
          {zones.length === 0 && (
            <div className="text-[11px] text-muted-main font-mono py-2">
              No zones mapped yet.
            </div>
          )}
          {zones.map((zone, i) => (
            <div
              key={zone.id}
              className="flex items-center gap-2 bg-white/2 border border-border-main rounded-md p-[6px_8px]"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_5px_currentColor]"
                style={{ background: zone.color, color: zone.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-main font-mono">Zone {i + 1}</div>
                <div className="text-[12px] text-text-main">
                  → Slot <strong className="text-accent">{zone.slotLabel}</strong>
                </div>
              </div>
              <button
                className="bg-none text-muted-main text-[12px] p-[2px_6px] rounded-sm border-none shrink-0 transition-colors duration-100 hover:text-red-500"
                onClick={() => onDeleteZone(zone.id)}
                title="Delete zone"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {zones.length > 0 && (
        <>
          <div className="h-px bg-border-main mx-3.5" />
          <div className="p-[10px_14px]">
            <button
              className="flex items-center gap-2 p-[8px_12px] rounded-md text-[13px] font-semibold tracking-[0.04em] w-full border border-transparent transition-all duration-120 text-left bg-white/3 text-muted-main hover:text-red-500 hover:border-red-500/30"
              onClick={onClearAll}
            >
              ⚠ Clear All Zones
            </button>
          </div>
        </>
      )}

      <div className="h-px bg-border-main mx-3.5" />
      <div className="p-[10px_14px] flex flex-col gap-1.5">
        <button
          className="flex border items-center gap-3 px-3 py-2 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors mt-1"
          onClick={onSaveSlot}
        >
          <span className="w-5 text-center">💾</span> Save Zones
        </button>
        <div className="text-[10px] font-bold tracking-[0.15em] text-[#2a3545] uppercase font-mono flex items-center gap-1.5">
          LEGEND
        </div>
        <div className="flex items-center gap-1.75 text-[11px] text-muted-main font-mono">
          <span className="w-2 h-2 rounded-full inline-block bg-green-status" /> Free slot
        </div>
        <div className="flex items-center gap-1.75 text-[11px] text-muted-main font-mono">
          <span className="w-2 h-2 rounded-full inline-block bg-accent-2" /> Already
          mapped
        </div>
      </div>
    </aside>
  );
}
