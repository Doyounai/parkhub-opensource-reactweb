import { useEffect, useRef } from 'react';
// import { polygonCentroid } from '../utils/geometry'
import { polygonCentroid } from '../../helper/editor/geometry';

interface Point {
  x: number;
  y: number;
}

interface Slot {
  id: string | number;
  label: string;
  points: Point[];
}

interface Layout {
  area: Point[];
  slots: Slot[];
}

interface PendingZone {
  color: string;
}

interface SlotPickerModalProps {
  layout: Layout;
  assignedSlotIds: Set<string | number>;
  pendingZone: PendingZone | null;
  onConfirm: (slotId: string | number, slotLabel: string) => void;
  onCancel: () => void;
}

interface CustomCanvasElement extends HTMLCanvasElement {
  _slotScreenData?: {
    slot: Slot;
    center: Point;
    screenPts: Point[];
  }[];
}

export default function SlotPickerModal({
  layout,
  assignedSlotIds,
  pendingZone,
  onConfirm,
  onCancel,
}: SlotPickerModalProps) {
  const canvasRef = useRef<CustomCanvasElement>(null);

  // Draw layout preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
      H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1118';
    ctx.fillRect(0, 0, W, H);

    // Compute bounding box to fit all points
    const allPts = [...layout.area, ...layout.slots.flatMap((s) => s.points)];
    if (allPts.length === 0) return;

    const minX = Math.min(...allPts.map((p) => p.x));
    const maxX = Math.max(...allPts.map((p) => p.x));
    const minY = Math.min(...allPts.map((p) => p.y));
    const maxY = Math.max(...allPts.map((p) => p.y));
    const PAD = 24;
    const scaleX = (W - PAD * 2) / (maxX - minX || 1);
    const scaleY = (H - PAD * 2) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    const tx = (p: Point) => (p.x - minX) * scale + PAD;
    const ty = (p: Point) => (p.y - minY) * scale + PAD;

    // Draw area
    if (layout.area.length >= 3) {
      ctx.beginPath();
      layout.area.forEach((p, i) => {
        i === 0 ? ctx.moveTo(tx(p), ty(p)) : ctx.lineTo(tx(p), ty(p));
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,229,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,229,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw slots — store screen rects for hit-testing
    canvas._slotScreenData = [];
    for (const slot of layout.slots) {
      const isAssigned = assignedSlotIds.has(slot.id);
      const screenPts = slot.points.map((p) => ({ x: tx(p), y: ty(p) }));
      const center = polygonCentroid(screenPts);

      ctx.beginPath();
      screenPts.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
      );
      ctx.closePath();

      ctx.fillStyle = isAssigned ? 'rgba(255,107,53,0.18)' : 'rgba(57,255,20,0.12)';
      ctx.fill();
      ctx.strokeStyle = isAssigned ? '#ff6b35' : '#39ff14';
      ctx.lineWidth = isAssigned ? 1.5 : 1;
      ctx.stroke();

      // Label
      ctx.font = 'bold 11px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isAssigned ? '#ff6b35' : '#c8d8e8';
      ctx.fillText(slot.label, center.x, center.y);

      canvas._slotScreenData.push({ slot, center, screenPts });
    }
  }, [layout, assignedSlotIds]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas?._slotScreenData) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Find nearest slot by centroid proximity
    let best = null,
      bestDist = Infinity;
    for (const entry of canvas._slotScreenData) {
      const dx = entry.center.x - mx;
      const dy = entry.center.y - my;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = entry;
      }
    }
    if (best && bestDist < 2500) {
      if (!assignedSlotIds.has(best.slot.id)) {
        onConfirm(best.slot.id, best.slot.label);
      }
    }
  };

  if (!pendingZone) return null;

  const unassignedCount =
    layout?.slots?.filter((s) => !assignedSlotIds.has(s.id)).length ?? 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] animate-[fadeIn_0.15s_ease]"
      onClick={onCancel}
    >
      <div
        className="bg-panel bg-white border border-border-main rounded-xl w-[540px] max-w-[95vw] shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,229,255,0.08)] animate-[slideUp_0.2s_ease] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[16px_20px_12px] border-b border-border-main">
          <div className="flex items-center gap-2.5 text-[14px] font-bold tracking-[0.12em] text-text-main">
            <span className="text-[18px]" style={{ color: pendingZone.color }}>
              ⬡
            </span>
            ASSIGN PARKING SLOT
          </div>
          <button
            className="bg-none text-muted-main text-[16px] p-[4px_8px] rounded-md transition-colors duration-150 hover:text-red-500"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        <p className="p-[12px_20px] text-[13px] text-muted-main leading-relaxed">
          Click a <span className="text-green-status font-semibold">green slot</span> in
          the layout below to link it to the camera zone you just drew.
          <span className="text-accent-2 font-semibold"> Orange slots</span> are already
          assigned.
        </p>

        <div className="mx-5 border border-border-main rounded-lg overflow-hidden bg-[#0d1118] min-h-[300px] flex items-center justify-center">
          {!layout || layout.slots.length === 0 ? (
            <div className="text-muted-main text-[13px] text-center line-height-relaxed p-10 font-mono">
              No parking layout found.
              <br />
              Draw a layout in the <strong className="text-accent">Editor</strong> tab
              first.
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={480}
              height={300}
              className="block w-full h-auto cursor-pointer"
              onClick={handleCanvasClick}
            />
          )}
        </div>

        <div className="flex items-center justify-between p-[12px_20px_16px] mt-3">
          <span className="text-[11px] font-mono text-muted-main">
            {unassignedCount} slot{unassignedCount !== 1 ? 's' : ''} available
          </span>
          <button
            className="bg-white/4 text-muted-main border border-border-main rounded-md p-[6px_18px] text-[13px] font-semibold tracking-[0.06em] transition-all duration-150 hover:text-text-main hover:border-muted-main"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: none; opacity: 1 } }
      `}</style>
    </div>
  );
}
