export interface Point {
  x: number;
  y: number;
}

export interface Slot {
  id?: number;
  points: Point[];
  label: string;
  occupied: boolean;
}

export interface Layout {
  area: Point[];
  slots: Slot[];
}

export type Mode = 'idle' | 'draw_area' | 'draw_slot' | 'select' | 'move' | 'move_image';

export interface GuideImage {
  url: string;
  element: HTMLImageElement | null;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

// Camera Editor

export type CameraMode = 'idle' | 'draw_slot' | 'select' | 'move';

export interface CameraSlot {
  id?: number;
  camera_id: number;
  slot_id?: number;
  points: Point[];
  point_pixel: Point[];
}

export interface CameraZone {
  id: string | number;
  points: Point[];
  slotId: string | number;
  slotLabel: string;
  color: string;
}

export type InputSessionPage = 'form' | 'summary';
export type SlotStatus = 'free' | 'occupied';

export interface ParkTwinSession {
  id: string;
  timestamp: number;
  slotStatuses: Record<string, 'free' | 'occupied'>;
  cameraImages: Record<string, { name: string; dataUrl: string }>;
  stats: { total: number; occupied: number; free: number };
}
