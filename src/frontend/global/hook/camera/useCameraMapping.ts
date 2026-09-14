import { useState, useCallback, useEffect } from 'react';
import { saveCameraMapping, clearCameraMapping } from '../../helper/editor/cameraStorage';
import { CameraZone } from '../../../../types/types';
import { CameraSlot } from '../camera-slot/useCameraSlot';

export function useCameraMapping(
  cameraId: string | number | undefined,
  cameraSlots: CameraSlot[],
) {
  const [zones, setZones] = useState<CameraZone[]>([]);

  // Load on mount / camera change
  useEffect(() => {
    if (!cameraId || !cameraSlots) return;

    console.log(cameraSlots);

    // const stored = loadCameraMapping(cameraId);
    const camSlot: CameraZone[] = cameraSlots.map((slot) => {
      return {
        id: slot.id,
        points: slot.points,
        slotId: slot.slot_id,
        slotLabel: slot.label,
        color: slot.color,
      };
    });
    setZones(camSlot || []);
  }, [cameraId, cameraSlots]);

  // Persist on every change
  useEffect(() => {
    if (!cameraId) return;
    saveCameraMapping(cameraId, { zones });
  }, [cameraId, zones]);

  const addZone = useCallback((zone: CameraZone) => {
    setZones((prev) => [...prev, zone]);
  }, []);

  const deleteZone = useCallback((zoneId: string | number) => {
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
  }, []);

  const clearAll = useCallback(() => {
    if (!cameraId) return;
    setZones([]);
    clearCameraMapping(cameraId);
  }, [cameraId]);

  const getSlotIds = useCallback(() => {
    return new Set(zones.map((z) => z.slotId));
  }, [zones]);

  return { zones, addZone, deleteZone, clearAll, getSlotIds };
}
