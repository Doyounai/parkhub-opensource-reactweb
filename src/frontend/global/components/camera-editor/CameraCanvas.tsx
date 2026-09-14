import { useRef, useEffect, useCallback } from 'react';
// import { DRAW_MODES } from '../hooks/useCameraDrawing'
// import { Point, CameraZone } from '../types'
import { DRAW_MODES } from '../../hook/camera/useCameraDrawing';
import { Point, CameraZone } from '../../../../types/types';

interface CameraCanvasProps {
  imageUrl: string;
  zones: CameraZone[];
  draftPoints: Point[];
  hoverPt: Point | null;
  drawMode: string;
  onImageClick: (pt: Point) => void;
  onMouseMove: (pt: Point) => void;
}

interface CustomCanvasElement extends HTMLCanvasElement {
  _imgBox?: {
    ox: number;
    oy: number;
    iw: number;
    ih: number;
  } | null;
}

export default function CameraCanvas({
  imageUrl,
  zones,
  draftPoints,
  hoverPt,
  drawMode,
  onImageClick,
  onMouseMove,
}: CameraCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CustomCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgLoadedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      imgLoadedRef.current = true;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, []);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0c10';
      ctx.fillRect(0, 0, W, H);

      // Draw camera image (letterboxed)
      if (imgRef.current && imgLoadedRef.current) {
        const img = imgRef.current;
        const scale = Math.min(W / img.width, H / img.height);
        const iw = img.width * scale,
          ih = img.height * scale;
        const ox = (W - iw) / 2,
          oy = (H - ih) / 2;
        ctx.drawImage(img, ox, oy, iw, ih);

        // Store letterbox params for coord conversion (read by event handlers)
        canvas._imgBox = { ox, oy, iw, ih };
      } else {
        canvas._imgBox = null;
      }

      // Draw saved zones
      for (const zone of zones) {
        drawZone(ctx, canvas, zone.points, zone.color, zone.slotLabel, false);
      }

      // Draft points
      if (draftPoints.length > 0) {
        drawDraftZone(ctx, canvas, draftPoints, hoverPt);
      }

      // Point count hint
      if (drawMode === DRAW_MODES.DRAWING) {
        drawPointHint(ctx, W, H, draftPoints.length);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [zones, draftPoints, hoverPt, drawMode]);

  // Convert screen coords → normalised 0–1 relative to image
  const toNorm = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas?._imgBox) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const { ox, oy, iw, ih } = canvas._imgBox;
    const nx = (sx - ox) / iw;
    const ny = (sy - oy) / ih;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return { x: nx, y: ny };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const pt = toNorm(e);
      if (pt) onImageClick(pt);
    },
    [toNorm, onImageClick],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pt = toNorm(e);
      if (pt) onMouseMove(pt);
    },
    [toNorm, onMouseMove],
  );

  const cursor = drawMode === DRAW_MODES.DRAWING ? 'crosshair' : 'default';

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden min-h-0">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ cursor }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}

// ── Drawing helpers ───────────────────────────────────────

function normToScreen(canvas: CustomCanvasElement, pt: Point) {
  const box = canvas._imgBox;
  if (!box) return { x: 0, y: 0 };
  return {
    x: pt.x * box.iw + box.ox,
    y: pt.y * box.ih + box.oy,
  };
}

function drawZone(
  ctx: CanvasRenderingContext2D,
  canvas: CustomCanvasElement,
  points: Point[],
  color: string,
  label: string,
  isHover: boolean,
) {
  if (points.length < 4) return;
  const pts = points.map((p) => normToScreen(canvas, p));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();

  ctx.fillStyle = hexAlpha(color, 0.18);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = isHover ? 2.5 : 1.8;
  ctx.setLineDash([]);
  ctx.stroke();

  // Corner dots
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Label at centroid
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

  ctx.font = 'bold 13px Rajdhani, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Tag background
  const tw = ctx.measureText(label).width + 14;
  ctx.fillStyle = hexAlpha('#0a0c10', 0.75);
  ctx.beginPath();
  if ('roundRect' in ctx) {
    (ctx as any).roundRect(cx - tw / 2, cy - 10, tw, 20, 4);
  } else {
    (ctx as any).rect(cx - tw / 2, cy - 10, tw, 20);
  }
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillText(label, cx, cy);
}

function drawDraftZone(
  ctx: CanvasRenderingContext2D,
  canvas: CustomCanvasElement,
  draftPoints: Point[],
  hoverPt: Point | null,
) {
  const color = '#ff6b35';
  const pts = draftPoints.map((p) => normToScreen(canvas, p));
  const hover = hoverPt ? normToScreen(canvas, hoverPt) : null;

  // Lines between placed points
  if (pts.length > 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (hover) ctx.lineTo(hover.x, hover.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (pts.length === 1 && hover) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(hover.x, hover.y);
    ctx.strokeStyle = hexAlpha(color, 0.5);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Preview closing line when 3 points placed
  if (pts.length === 3 && hover) {
    ctx.beginPath();
    ctx.moveTo(hover.x, hover.y);
    ctx.lineTo(pts[0].x, pts[0].y);
    ctx.strokeStyle = hexAlpha(color, 0.35);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Placed point dots
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawPointHint(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  count: number,
) {
  const text = `Click point ${count + 1} of 4`;
  ctx.font = '12px Share Tech Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width + 20;
  ctx.fillStyle = 'rgba(10,12,16,0.8)';
  ctx.beginPath();
  if ('roundRect' in ctx) {
    (ctx as any).roundRect(W / 2 - tw / 2, H - 40, tw, 26, 13);
  } else {
    (ctx as any).rect(W / 2 - tw / 2, H - 40, tw, 26);
  }
  ctx.fill();
  ctx.fillStyle = '#ff6b35';
  ctx.fillText(text, W / 2, H - 27);
}

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
