import { useState, useCallback, useEffect, useRef } from 'react';
// import { saveLayout, loadLayout } from '../utils/storage';
// import { snapToFirst, polygonCentroid, distanceSq } from '../utils/geometry';
// import { Point, Slot, Layout, Mode } from '../types'
import { Point, Slot, Layout, Mode, GuideImage } from '../../../../types/types';
import { snapToFirst, polygonCentroid, distanceSq } from '../../helper/editor/geometry';
import { saveLayout, loadLayout } from '../../helper/editor/storage';

export const MODES: Record<string, Mode> = {
  IDLE: 'idle',
  DRAW_AREA: 'draw_area',
  DRAW_SLOT: 'draw_slot',
  SELECT: 'select',
  MOVE: 'move',
  MOVE_IMAGE: 'move_image',
};

const SNAP_THRESHOLD = 14;
const INITIAL_LAYOUT: Layout = { area: [], slots: [] };

export function useEditorState(inital_layout?: Layout) {
  const [mode, setMode] = useState<Mode>(MODES.IDLE);
  const [layout, setLayout] = useState<Layout>(
    () => inital_layout || loadLayout() || INITIAL_LAYOUT,
  );
  const [draftPoints, setDraftPoints] = useState<Point[]>([]); // points being placed
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverPt, setHoverPt] = useState<Point | null>(null); // mouse position for preview line
  const [editLabel, setEditLabel] = useState<string>('');
  const [showLabelInput, setShowLabelInput] = useState<boolean>(false);
  const [offset, setOffset] = useState<Point>({ x: 60, y: 60 });
  const [scale, setScale] = useState<number>(1);
  const [guideImage, setGuideImage] = useState<GuideImage | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<Point | null>(null);
  const dragSlotOrigin = useRef<Point[]>([]);
  const dragImageOrigin = useRef<Point | null>(null);
  const slotCounter = useRef<number>((loadLayout()?.slots?.length || 0) + 1);

  useEffect(() => {
    if (inital_layout) {
      setLayout(inital_layout);
    }
  }, [inital_layout]);

  // Persist on every layout change
  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  // ── Mode helpers ─────────────────────────────────────
  const startDrawArea = useCallback(() => {
    setMode(MODES.DRAW_AREA);
    setDraftPoints([]);
    setSelectedId(null);
  }, []);

  const startDrawSlot = useCallback(() => {
    setMode(MODES.DRAW_SLOT);
    setDraftPoints([]);
    setSelectedId(null);
  }, []);

  const cancelDraw = useCallback(() => {
    setMode(MODES.IDLE);
    setDraftPoints([]);
    setHoverPt(null);
  }, []);

  const clearAll = useCallback(() => {
    setLayout(INITIAL_LAYOUT);
    setDraftPoints([]);
    setSelectedId(null);
    setMode(MODES.IDLE);
    slotCounter.current = 1;
  }, []);

  // ── Canvas click handler ──────────────────────────────
  const handleCanvasClick = useCallback(
    (worldPt: Point) => {
      if (mode === MODES.DRAW_AREA) {
        setDraftPoints((prev) => {
          // Snap-close: if clicking near first point and enough points
          if (prev.length >= 3 && snapToFirst(worldPt, prev, SNAP_THRESHOLD / scale)) {
            // Close area
            setLayout((lay) => ({ ...lay, area: prev }));
            setMode(MODES.IDLE);
            setDraftPoints([]);
            setHoverPt(null);
            return [];
          }
          return [...prev, worldPt];
        });
        return;
      }

      if (mode === MODES.DRAW_SLOT) {
        setDraftPoints((prev) => {
          const next = [...prev, worldPt];
          if (next.length === 4) {
            // Complete quad slot
            // const id = `slot_${Date.now()}`;
            const label = `P${slotCounter.current++}`;
            setLayout((lay) => ({
              ...lay,
              slots: [...lay.slots, { points: next, label, occupied: false }],
            }));
            setMode(MODES.IDLE);
            setDraftPoints([]);
            setHoverPt(null);
            return [];
          }
          return next;
        });
        return;
      }

      if (mode === MODES.IDLE || mode === MODES.SELECT) {
        // Hit-test slots (centroid proximity)
        const hit = findSlotAtPoint(layout.slots, worldPt);
        setSelectedId(hit?.label ?? null);
      }
    },
    [mode, layout.slots, scale],
  );

  // ── Mouse move ────────────────────────────────────────
  const handleMouseMove = useCallback(
    (worldPt: Point, _screenPt: Point) => {
      if (mode === MODES.DRAW_AREA || mode === MODES.DRAW_SLOT) {
        setHoverPt(worldPt);
      }
      if (mode === MODES.MOVE && isDragging.current && dragStart.current) {
        const dx = worldPt.x - dragStart.current.x;
        const dy = worldPt.y - dragStart.current.y;
        setLayout((lay) => ({
          ...lay,
          slots: lay.slots.map((s) =>
            s.label !== selectedId
              ? s
              : {
                  ...s,
                  points: dragSlotOrigin.current.map((p) => ({
                    x: p.x + dx,
                    y: p.y + dy,
                  })),
                },
          ),
        }));
      }

      if (mode === MODES.MOVE_IMAGE && isDragging.current && dragStart.current && dragImageOrigin.current) {
        const dx = worldPt.x - dragStart.current.x;
        const dy = worldPt.y - dragStart.current.y;
        setGuideImage((prev) =>
          prev
            ? {
                ...prev,
                x: dragImageOrigin.current!.x + dx,
                y: dragImageOrigin.current!.y + dy,
              }
            : null,
        );
      }
    },
    [mode, selectedId],
  );

  const handleMouseDown = useCallback(
    (worldPt: Point) => {
      if (mode === MODES.MOVE && selectedId) {
        isDragging.current = true;
        dragStart.current = worldPt;
        const slot = layout.slots.find((s) => s.label === selectedId);
        dragSlotOrigin.current = slot ? slot.points.map((p) => ({ ...p })) : [];
      }

      if (mode === MODES.MOVE_IMAGE && guideImage) {
        isDragging.current = true;
        dragStart.current = worldPt;
        dragImageOrigin.current = { x: guideImage.x, y: guideImage.y };
      }
    },
    [mode, selectedId, layout.slots, guideImage],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    dragStart.current = null;
  }, []);

  // ── Pan & zoom ────────────────────────────────────────
  const handlePan = useCallback((dx: number, dy: number) => {
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const handleZoom = useCallback((delta: number, cx: number, cy: number) => {
    setScale((s) => {
      const factor = delta > 0 ? 0.9 : 1.1;
      const next = Math.max(0.2, Math.min(5, s * factor));
      setOffset((o) => ({
        x: cx - (cx - o.x) * (next / s),
        y: cy - (cy - o.y) * (next / s),
      }));
      return next;
    });
  }, []);

  // ── Slot actions ──────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setLayout((lay) => ({
      ...lay,
      slots: lay.slots.filter((s) => s.label !== selectedId),
    }));
    setSelectedId(null);
  }, [selectedId]);

  const renameSelected = useCallback(
    (newLabel: string) => {
      if (!selectedId) return;
      setLayout((lay) => ({
        ...lay,
        slots: lay.slots.map((s) =>
          s.label !== selectedId ? s : { ...s, label: newLabel },
        ),
      }));
      setShowLabelInput(false);
    },
    [selectedId],
  );

  const openLabelEdit = useCallback(() => {
    if (!selectedId) return;
    const slot = layout.slots.find((s) => s.label === selectedId);
    setEditLabel(slot?.label ?? '');
    setShowLabelInput(true);
  }, [selectedId, layout.slots]);

  const clearArea = useCallback(() => {
    setLayout((lay) => ({ ...lay, area: [] }));
  }, []);

  const selectedSlot = layout.slots.find((s) => s.label === selectedId) ?? null;

  return {
    mode,
    setMode,
    layout,
    draftPoints,
    selectedId,
    selectedSlot,
    hoverPt,
    offset,
    scale,
    editLabel,
    setEditLabel,
    showLabelInput,
    setShowLabelInput,
    guideImage,
    setGuideImage,
    // actions
    startDrawArea,
    startDrawSlot,
    cancelDraw,
    clearAll,
    clearArea,
    deleteSelected,
    renameSelected,
    openLabelEdit,
    handleCanvasClick,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handlePan,
    handleZoom,
  };
}

// ── Helpers ───────────────────────────────────────────────
function findSlotAtPoint(slots: Slot[], pt: Point): Slot | null {
  let best: Slot | null = null,
    bestDist = 900;
  for (const s of slots) {
    const c = polygonCentroid(s.points);
    const d = distanceSq(c, pt);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return bestDist < 1600 ? best : null; // ~40px radius
}
