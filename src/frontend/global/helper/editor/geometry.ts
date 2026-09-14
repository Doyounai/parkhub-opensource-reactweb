import { Point } from '../../../../types/types';

export function pointInPolygon(pt: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(points: Point[]): Point {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  let x = 0,
    y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / n, y: y / n };
}

export function distanceSq(a: Point, b: Point): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export function snapToFirst(pt: Point, polygon: Point[], threshold = 14): boolean {
  if (polygon.length < 3) return false;
  return distanceSq(pt, polygon[0]) < threshold * threshold;
}

export function transformPoint(
  pt: Point,
  offsetX: number,
  offsetY: number,
  scale: number,
): Point {
  return { x: (pt.x - offsetX) / scale, y: (pt.y - offsetY) / scale };
}

export function screenPoint(
  pt: Point,
  offsetX: number,
  offsetY: number,
  scale: number,
): Point {
  return { x: pt.x * scale + offsetX, y: pt.y * scale + offsetY };
}

/** Compute bounding box center & orientation angle for a quad slot */
export function slotTransform(pts: Point[]): { cx: number; cy: number; angle: number } {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  // angle from edge 0→1
  const dx = pts[1].x - pts[0].x;
  const dy = pts[1].y - pts[0].y;
  const angle = Math.atan2(dy, dx);
  return { cx, cy, angle };
}
