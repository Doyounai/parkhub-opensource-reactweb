import { useEffect, useRef } from 'react';
import { MODES } from './useEditorState';
// import { screenPoint, polygonCentroid } from '../utils/geometry'
// import { Point, Layout, Mode } from '../types'
import { Layout, Mode, Point, GuideImage } from '../../../../types/types';
import { screenPoint, polygonCentroid } from '../../helper/editor/geometry';

const COLORS = {
  areaBorder: '#00e5ff',
  areaFill: 'rgba(0,229,255,0.06)',
  areaDraft: 'rgba(0,229,255,0.35)',
  slotFree: 'rgba(57,255,20,0.13)',
  slotOcc: 'rgba(255,45,85,0.18)',
  slotBorder: '#39ff14',
  slotOccBorder: '#ff2d55',
  slotSelected: '#00e5ff',
  labelColor: '#c8d8e8',
  draftLine: 'rgba(255,107,53,0.8)',
  draftPoint: '#ff6b35',
  snapCircle: 'rgba(0,229,255,0.5)',
  // grid: 'rgba(255,255,255,0.03)',
  grid: 'rgb(179, 180, 183)',
};
const SNAP_THRESHOLD = 14;

interface RendererOptions {
  layout: Layout;
  draftPoints: Point[];
  hoverPt: Point | null;
  selectedId: string | null;
  mode: Mode;
  offset: Point;
  scale: number;
  guideImage: GuideImage | null;
}

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  {
    layout,
    draftPoints,
    hoverPt,
    selectedId,
    mode,
    offset,
    scale,
    guideImage,
  }: RendererOptions,
) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background
      // ctx.fillStyle = '#0a0c10';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Grid
      drawGrid(ctx, W, H, offset, scale);

      // Guide Image
      if (guideImage && guideImage.element) {
        ctx.globalAlpha = guideImage.opacity;
        const sx = offset.x + guideImage.x * scale;
        const sy = offset.y + guideImage.y * scale;
        const sw = guideImage.element.width * guideImage.scale * scale;
        const sh = guideImage.element.height * guideImage.scale * scale;
        ctx.drawImage(guideImage.element, sx, sy, sw, sh);
        ctx.globalAlpha = 1;
      }

      // Area polygon
      if (layout.area.length >= 3) {
        drawPolygon(
          ctx,
          layout.area,
          offset,
          scale,
          COLORS.areaFill,
          COLORS.areaBorder,
          1.5,
        );
      }

      // Slots
      for (const slot of layout.slots) {
        const isSelected = slot.id?.toString() === selectedId || slot.label === selectedId;

        const border = isSelected
          ? COLORS.slotSelected
          : slot.occupied
            ? COLORS.slotOccBorder
            : COLORS.slotBorder;
        const fill = isSelected
          ? 'rgba(0,229,255,0.15)'
          : slot.occupied
            ? COLORS.slotOcc
            : COLORS.slotFree;
        drawPolygon(ctx, slot.points, offset, scale, fill, border, isSelected ? 2 : 1);

        // Label
        const c = polygonCentroid(slot.points);
        const sc = screenPoint(c, offset.x, offset.y, scale);
        ctx.font = `bold ${Math.max(10, 12 * scale)}px Rajdhani, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isSelected ? COLORS.slotSelected : COLORS.labelColor;
        ctx.fillText(slot.label, sc.x, sc.y);

        // Selected: corner dots
        if (isSelected) {
          for (const p of slot.points) {
            const sp = screenPoint(p, offset.x, offset.y, scale);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.slotSelected;
            ctx.fill();
          }
        }
      }

      // Draft area: show placed points + live line to cursor
      if (mode === MODES.DRAW_AREA && draftPoints.length > 0) {
        drawDraftPath(ctx, draftPoints, hoverPt, offset, scale, true);
      }

      // Draft slot: up to 4 points
      if (mode === MODES.DRAW_SLOT && draftPoints.length > 0) {
        drawDraftPath(ctx, draftPoints, hoverPt, offset, scale, false);
        // preview closing edge when 3 points placed
        if (draftPoints.length === 3 && hoverPt) {
          const sp0 = screenPoint(draftPoints[0], offset.x, offset.y, scale);
          const spH = screenPoint(hoverPt, offset.x, offset.y, scale);
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(255,107,53,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(spH.x, spH.y);
          ctx.lineTo(sp0.x, sp0.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Snap indicator for area close
      if (mode === MODES.DRAW_AREA && draftPoints.length >= 3 && hoverPt) {
        const first = draftPoints[0];
        const dx = hoverPt.x - first.x,
          dy = hoverPt.y - first.y;
        if (dx * dx + dy * dy < (SNAP_THRESHOLD / scale) ** 2) {
          const sp = screenPoint(first, offset.x, offset.y, scale);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.snapCircle;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    canvasRef,
    layout,
    draftPoints,
    hoverPt,
    selectedId,
    mode,
    offset,
    scale,
    guideImage,
  ]);
}

// ── Draw helpers ─────────────────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  offset: Point,
  scale: number,
) {
  const spacing = 40 * scale;
  const ox = ((offset.x % spacing) + spacing) % spacing;
  const oy = ((offset.y % spacing) + spacing) % spacing;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = ox; x < W; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = oy; y < H; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  offset: Point,
  scale: number,
  fill: string,
  stroke: string,
  lineWidth: number,
) {
  if (points.length < 2) return;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const sp = screenPoint(points[i], offset.x, offset.y, scale);
    i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Vertex dots
  for (const p of points) {
    const sp = screenPoint(p, offset.x, offset.y, scale);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();
  }
}

function drawDraftPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  hoverPt: Point | null,
  offset: Point,
  scale: number,
  closeable: boolean,
) {
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = COLORS.draftLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const sp = screenPoint(points[i], offset.x, offset.y, scale);
    i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y);
  }
  if (hoverPt) {
    const sh = screenPoint(hoverPt, offset.x, offset.y, scale);
    ctx.lineTo(sh.x, sh.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Point markers
  for (const p of points) {
    const sp = screenPoint(p, offset.x, offset.y, scale);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.draftPoint;
    ctx.fill();
  }
  // First point highlight (snap target)
  if (closeable && points.length >= 3) {
    const sp = screenPoint(points[0], offset.x, offset.y, scale);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.snapCircle;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
