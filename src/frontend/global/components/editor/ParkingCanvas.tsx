import { useRef, useEffect, useCallback } from 'react'
// import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
// import { MODES } from '../hooks/useEditorState'
// import { Point, Layout, Mode } from '../types'

import { MODES } from '../../hook/editor/useEditorState';
import { Layout, Mode, Point, GuideImage } from '../../../../types/types';
import { useCanvasRenderer } from '../../hook/editor/useCanvasRenderer';

interface ParkingCanvasProps {
  layout: Layout;
  draftPoints: Point[];
  hoverPt: Point | null;
  selectedId: string | null;
  mode: Mode;
  offset: Point;
  scale: number;
  onCanvasClick: (pt: Point) => void;
  onMouseMove: (worldPt: Point, screenPt: Point) => void;
  onMouseDown: (pt: Point) => void;
  onMouseUp: () => void;
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number, cx: number, cy: number) => void;
  guideImage: GuideImage | null;
}

export default function ParkingCanvas({
  layout, draftPoints, hoverPt, selectedId, mode, offset, scale,
  onCanvasClick, onMouseMove, onMouseDown, onMouseUp, onPan, onZoom, guideImage
}: ParkingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const panRef = useRef<Point | null>(null)

  useCanvasRenderer(canvasRef, { layout, draftPoints, hoverPt, selectedId, mode, offset, scale, guideImage })

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.parentElement) return
    const parent = canvas.parentElement
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        canvas.width = e.contentRect.width
        canvas.height = e.contentRect.height
      }
    })
    ro.observe(parent)
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight
    return () => ro.disconnect()
  }, [])

  const toWorld = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    return { x: (sx - offset.x) / scale, y: (sy - offset.y) / scale }
  }, [offset, scale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panRef.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      return
    }
    if (e.button === 0) {
      onMouseDown(toWorld(e))
    }
  }, [toWorld, onMouseDown])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (panRef.current) {
      onPan(e.clientX - panRef.current.x, e.clientY - panRef.current.y)
      panRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    onMouseMove(toWorld(e), { x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [toWorld, onMouseMove, onPan])

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    if (panRef.current) { panRef.current = null; return }
    onMouseUp()
  }, [onMouseUp])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.altKey) return
    onCanvasClick(toWorld(e))
  }, [toWorld, onCanvasClick])

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    onZoom(e.deltaY, e.clientX - rect.left, e.clientY - rect.top)
  }, [onZoom])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.addEventListener('wheel', handleWheel, { passive: false })
    return () => c.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const cursor = mode === MODES.DRAW_AREA || mode === MODES.DRAW_SLOT
    ? 'crosshair'
    : mode === MODES.MOVE || mode === MODES.MOVE_IMAGE ? 'grab' : 'default'

  return (
    <div className="flex-1 relative overflow-hidden ">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  )
}

