import { useState, useCallback, useRef } from 'react';
// import { Point } from '../types'
import { Point } from '../../../../types/types';

export const DRAW_MODES = {
  IDLE: 'idle',
  DRAWING: 'drawing', // placing 4 points
};

const ZONE_COLORS = [
  '#00e5ff',
  '#ff6b35',
  '#39ff14',
  '#ff2d55',
  '#aa44ff',
  '#ffdd33',
  '#00ff88',
  '#ff8800',
];

let colorIdx = 0;
function nextColor() {
  const c = ZONE_COLORS[colorIdx % ZONE_COLORS.length];
  colorIdx++;
  return c;
}

interface PendingZone {
  points: Point[];
  color: string;
}

export function useCameraDrawing(_cameraId: string | number | undefined) {
  const [drawMode, setDrawMode] = useState(DRAW_MODES.IDLE);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]); // up to 4 {x,y} (0–1 normalised)
  const [hoverPt, setHoverPt] = useState<Point | null>(null);
  const [pendingZone, setPendingZone] = useState<PendingZone | null>(null); // completed 4-pt zone awaiting slot pick
  const colorRef = useRef(nextColor());

  // ── Start drawing a new zone ──────────────────────────
  const startDrawing = useCallback(() => {
    colorRef.current = nextColor();
    setDrawMode(DRAW_MODES.DRAWING);
    setDraftPoints([]);
    setHoverPt(null);
    setPendingZone(null);
  }, []);

  const cancelDrawing = useCallback(() => {
    setDrawMode(DRAW_MODES.IDLE);
    setDraftPoints([]);
    setHoverPt(null);
    setPendingZone(null);
  }, []);

  // ── Handle canvas click (normalised 0–1 coords) ───────
  const handleImageClick = useCallback(
    (normPt: Point) => {
      if (drawMode !== DRAW_MODES.DRAWING) return;

      setDraftPoints((prev) => {
        const next = [...prev, normPt];
        if (next.length === 4) {
          // Zone complete — trigger slot picker
          setPendingZone({ points: next, color: colorRef.current });
          setDrawMode(DRAW_MODES.IDLE);
          setDraftPoints([]);
          setHoverPt(null);
          return [];
        }
        return next;
      });
    },
    [drawMode],
  );

  const handleMouseMove = useCallback(
    (normPt: Point) => {
      if (drawMode === DRAW_MODES.DRAWING) setHoverPt(normPt);
    },
    [drawMode],
  );

  // Called when user picks a slot in the modal — returns the finished zone
  const confirmZone = useCallback(
    (slotId: string | number, slotLabel: string) => {
      if (!pendingZone) return null;
      const zone = {
        id: `zone_${Date.now()}`,
        points: pendingZone.points,
        color: pendingZone.color,
        slotId,
        slotLabel,
      };
      setPendingZone(null);
      return zone;
    },
    [pendingZone],
  );

  const dismissPending = useCallback(() => setPendingZone(null), []);

  return {
    drawMode,
    draftPoints,
    hoverPt,
    pendingZone,
    startDrawing,
    cancelDrawing,
    handleImageClick,
    handleMouseMove,
    confirmZone,
    dismissPending,
  };
}
