import { useState, useCallback, useMemo, useEffect } from 'react';
// import { loadLayout } from '../utils/storage';
// import { saveSession } from '../utils/sessionStorage';
// import { Layout, InputSessionPage, SlotStatus, ParkTwinSession } from '../types';
import {
  Layout,
  InputSessionPage,
  SlotStatus,
  ParkTwinSession,
} from '../../../../types/types';
import {
  SubmitSlotEvent,
  useSubmitAreaSession,
  useSubmitSession,
} from './useSubmitSession';
import Swal from 'sweetalert2';

export const PAGE: Record<string, InputSessionPage> = {
  FORM: 'form',
  SUMMARY: 'summary',
};

export function useInputSession(initalLayout: Layout, areaId: number) {
  const layout = useMemo<Layout>(
    () => initalLayout || { area: [], slots: [] },
    [initalLayout],
  );
  // const [layout, setLayout] = useState<Layout>(initalLayout || { area: [], slots: [] });

  // slot status map: slotId → 'free' | 'occupied'
  const [slotStatuses, setSlotStatuses] = useState<Record<string, SlotStatus>>(() => {
    const map: Record<string, SlotStatus> = {};
    for (const s of layout.slots) map[s.id || ''] = 'free';
    return map;
  });

  useEffect(() => {
    const map: Record<string, SlotStatus> = {};
    for (const s of layout.slots) map[s.id || ''] = 'free';

    setSlotStatuses(map);
  }, [initalLayout]);

  // camera images: cameraId → { file, name, dataUrl }
  const [cameraImages, setCameraImages] = useState<
    Record<string, { id: string; name: string; dataUrl: string; file: File }>
  >({});

  // ui state
  const [page, setPage] = useState<InputSessionPage>(PAGE.FORM);
  const [lastSession, setLastSession] = useState<ParkTwinSession | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    mutateAsync: submitAreaSession,
    data: submitAreaSessionData,
    error: submitAreaSessionError,
  } = useSubmitAreaSession();

  const { mutateAsync: submitSession } = useSubmitSession();

  // ── Toggle a single slot ───────────────────────────────
  const toggleSlot = useCallback((slotId: string) => {
    setSlotStatuses((prev) => ({
      ...prev,
      [slotId]: prev[slotId] === 'free' ? 'occupied' : 'free',
    }));
  }, []);

  const setAllFree = useCallback(() => {
    setSlotStatuses((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, 'free' as SlotStatus])),
    );
  }, []);

  const setAllOccupied = useCallback(() => {
    setSlotStatuses((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, 'occupied' as SlotStatus])),
    );
  }, []);

  // ── Camera image upload ────────────────────────────────
  const setCameraImage = useCallback((cameraId: string, file: File | null) => {
    if (!file) {
      setCameraImages((prev) => {
        const n = { ...prev };
        delete n[cameraId];
        return n;
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCameraImages((prev) => ({
          ...prev,
          [cameraId]: {
            id: cameraId,
            name: file.name,
            dataUrl: e.target?.result as string,
            file: file,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const values = Object.values(slotStatuses);
    const total = values.length;
    const occupied = values.filter((v) => v === 'occupied').length;
    const free = total - occupied;
    return { total, occupied, free };
  }, [slotStatuses]);

  // ── Submit cycle ───────────────────────────────────────
  const submit = useCallback(async () => {
    setSubmitting(true);
    const session: ParkTwinSession = {
      id: `cycle_${Date.now()}`,
      timestamp: Date.now(),
      slotStatuses: { ...slotStatuses },
      cameraImages: Object.fromEntries(
        Object.entries(cameraImages).map(([k, v]) => [k, { name: v.name, dataUrl: '' }]), // dataUrl is empty in persisted session to save space
      ),
      stats,
    };
    // saveSession(session);
    setLastSession({ ...session, cameraImages }); // keep dataUrls in memory for summary

    // Submit
    const slotEvents: SubmitSlotEvent[] = Object.entries(slotStatuses).map(
      ([key, value]) => {
        return {
          slot_id: Number(key),
          status: value == 'free' ? 'empty' : 'occupied',
          type: 'manual',
        };
      },
    );

    try {
      const res = await submitAreaSession({
        area_id: areaId,
        slot_events: slotEvents,
      });

      if (!submitAreaSessionError && res.data) {
        const fd = new FormData();

        Object.values(cameraImages).forEach((img) => {
          fd.append('camera_ids[]', img.id.toString());
          fd.append('images', img.file);
        });

        fd.append('session_id', res.data.areaSessionId.toString());

        const submitSessionResult = await submitSession(fd);

        console.log('Submit session result:', submitSessionResult);

        setPage(PAGE.SUMMARY);
      } else {
        console.log('Submission error:', submitAreaSessionError);
        console.log('Submission response:', res.data);
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'An error occurred while submitting the area session.',
        });
      }
    } catch (err: any) {
      console.log('Submission caught error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err?.message || 'An unexpected error occurred during submission.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [slotStatuses, cameraImages, stats]);

  // ── Start new cycle ────────────────────────────────────
  const newCycle = useCallback(() => {
    const map: Record<string, SlotStatus> = {};
    for (const s of layout.slots) map[s.id || ''] = 'free';
    setSlotStatuses(map);
    setCameraImages({});
    setPage(PAGE.FORM);
  }, [layout.slots]);

  return {
    layout,
    slotStatuses,
    toggleSlot,
    setAllFree,
    setAllOccupied,
    cameraImages,
    setCameraImage,
    stats,
    page,
    lastSession,
    submitting,
    submit,
    newCycle,
  };
}
