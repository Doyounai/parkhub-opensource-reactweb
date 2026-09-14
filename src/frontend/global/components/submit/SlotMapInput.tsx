import { useRef, useEffect, useCallback } from 'react';
// import { polygonCentroid } from '../utils/geometry';
// import { Layout, SlotStatus, Slot, Point } from '../types';
import { polygonCentroid } from '../../helper/editor/geometry';
import { Layout, SlotStatus, Slot, Point } from '../../../../types/types';

const PAD = 28;

interface SlotMapInputProps {
  layout: Layout;
  slotStatuses: Record<string, SlotStatus>;
  onToggle: (slotId: string) => void;
}

interface MapEntry {
  slot: Slot;
  cx: number;
  cy: number;
}

export default function SlotMapInput({
  layout,
  slotStatuses,
  onToggle,
}: SlotMapInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDataRef = useRef<MapEntry[]>([]); // [{ slot, cx, cy }] for hit-testing

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
      H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1118';
    ctx.fillRect(0, 0, W, H);

    const { area, slots } = layout;
    if (slots.length === 0 && area.length === 0) {
      ctx.font = '13px Share Tech Mono, monospace';
      ctx.fillStyle = '#2a3545';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No parking layout found. Draw one in the Editor.', W / 2, H / 2);
      return;
    }

    // Compute bounding box
    const allPts = [...area, ...slots.flatMap((s) => s.points)];
    if (!allPts.length) return;
    const minX = Math.min(...allPts.map((p) => p.x));
    const maxX = Math.max(...allPts.map((p) => p.x));
    const minY = Math.min(...allPts.map((p) => p.y));
    const maxY = Math.max(...allPts.map((p) => p.y));
    const scaleX = (W - PAD * 2) / (maxX - minX || 1);
    const scaleY = (H - PAD * 2) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    // Centre the layout
    const usedW = (maxX - minX) * scale;
    const usedH = (maxY - minY) * scale;
    const offX = (W - usedW) / 2;
    const offY = (H - usedH) / 2;

    const tx = (p: Point) => (p.x - minX) * scale + offX;
    const ty = (p: Point) => (p.y - minY) * scale + offY;

    // Area boundary
    if (area.length >= 3) {
      ctx.beginPath();
      area.forEach((p, i) =>
        i === 0 ? ctx.moveTo(tx(p), ty(p)) : ctx.lineTo(tx(p), ty(p)),
      );
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,229,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,229,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Grid subtle
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = offX % step; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = offY % step; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Slots
    mapDataRef.current = [];
    for (const slot of slots) {
      const status = slotStatuses[slot.id] ?? 'free';
      const isOcc = status === 'occupied';
      const pts = slot.points.map((p) => ({ x: tx(p), y: ty(p) }));
      const center = polygonCentroid(pts);

      // Fill
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = isOcc ? 'rgba(255,45,85,0.22)' : 'rgba(57,255,20,0.14)';
      ctx.fill();

      // Border
      ctx.strokeStyle = isOcc ? '#ff2d55' : '#39ff14';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Status indicator dot
      ctx.beginPath();
      ctx.arc(center.x, center.y - 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = isOcc ? '#ff2d55' : '#39ff14';
      ctx.fill();

      // Label
      ctx.font = `bold ${Math.max(9, Math.min(13, scale * 6))}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isOcc ? '#ff2d55' : '#c8d8e8';
      ctx.fillText(slot.label, center.x, center.y + 6);

      mapDataRef.current.push({ slot, cx: center.x, cy: center.y });
    }
  }, [layout, slotStatuses]);

  // Resize + redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
      draw();
    });
    ro.observe(canvas.parentElement);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      let best: MapEntry | null = null,
        bestDist = Infinity;
      for (const entry of mapDataRef.current) {
        const d = (entry.cx - mx) ** 2 + (entry.cy - my) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = entry;
        }
      }
      if (best && bestDist < 2500) onToggle(best.slot.id.toString());
    },
    [onToggle],
  );

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border border-border bg-[#0d1118]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
}
