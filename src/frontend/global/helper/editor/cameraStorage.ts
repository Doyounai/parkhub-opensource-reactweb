// import { CameraZone } from '../types'
import { CameraZone } from '../../../../types/types';

const CAMERA_KEY = (cameraId: string | number) => `parktwin_camera_${cameraId}`;

interface CameraMapping {
  zones: CameraZone[];
}

export function saveCameraMapping(
  cameraId: string | number,
  mapping: CameraMapping,
): void {
  try {
    localStorage.setItem(CAMERA_KEY(cameraId), JSON.stringify(mapping));
  } catch (e) {
    console.warn('Failed to save camera mapping', e);
  }
}

export function loadCameraMapping(cameraId: string | number): CameraMapping {
  try {
    const raw = localStorage.getItem(CAMERA_KEY(cameraId));
    if (!raw) return { zones: [] };
    return JSON.parse(raw);
  } catch {
    return { zones: [] };
  }
}

export function clearCameraMapping(cameraId: string | number): void {
  localStorage.removeItem(CAMERA_KEY(cameraId));
}
