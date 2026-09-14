import './index.scss';

import { I18nDomainResource } from './i18n';
import { useNavigate, useParams } from 'react-router-dom';
import { useCameraDetail } from '../../global/hook/camera/useCamera';
import { useCameraMapping } from '../../global/hook/camera/useCameraMapping';
import { useCameraDrawing } from '../../global/hook/camera/useCameraDrawing';
import CameraToolbar from '../../global/components/camera-editor/CameraToolbar';
import CameraCanvas from '../../global/components/camera-editor/CameraCanvas';
import SlotPickerModal from '../../global/components/camera-editor/SlotPickerModal';
import { useAreaDetail } from '../../global/hook/useArea';
import React, { useEffect, useState } from 'react';
import {
  CameraSlotBody,
  useCameraSlotCreateBulk,
  useCameraSlotGetBulk,
} from '../../global/hook/camera-slot/useCameraSlot';
import Swal from 'sweetalert2';

const domainName = 'area-camera';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  const { id, cameraid } = useParams<{ id: string; cameraid: string }>();
  const areaId = Number(id);
  const cameraId = Number(cameraid);
  const navigate = useNavigate();

  const { data: areaData } = useAreaDetail(areaId);
  const { data, isLoading, error } = useCameraDetail(cameraId);

  const { data: cameraSlots } = useCameraSlotGetBulk(Number(cameraId));

  const { zones, addZone, deleteZone, clearAll, getSlotIds } = useCameraMapping(
    cameraid,
    cameraSlots?.data || [],
  );

  const { mutateAsync: createCameraSlotBulk, isPending } =
    useCameraSlotCreateBulk(cameraId);

  const drawing = useCameraDrawing(id);

  const [layout, setLayout] = useState<any | null>(null);

  useEffect(() => {
    if (areaData) {
      setLayout(areaData.data.area_json);
    }
  }, [areaData]);

  const handleConfirmSlot = (slotId: string | number, slotLabel: string) => {
    const zone = drawing.confirmZone(slotId, slotLabel);
    if (zone) addZone(zone);
  };

  const handleSaveZones = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    try {
      // await createArea({ name, des });

      const body: CameraSlotBody[] = zones.map((zone) => {
        return {
          camera_id: cameraId,
          label: zone.slotLabel,
          slot_id: Number(zone.slotId),
          points: zone.points,
          color: zone.color,
        };
      });

      createCameraSlotBulk({
        data: body,
      });

      Swal.fire({
        icon: 'success',
        title: 'Created',
        text: 'Area created successfully.',
        confirmButtonColor: '#1f2937',
        // timer: 1500,
        // showConfirmButton: false,
      }).finally(() => {
        navigate(`/area/${areaId}`);
      });
      // onCreated();
      // onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to create area.',
        confirmButtonColor: '#1f2937',
      });
    }
  };

  const camera = data?.data;

  if (isLoading || isPending)
    return <CameraStatus icon="⟳" text={`Loading camera ${id}…`} spin />;
  if (error) return <CameraStatus icon="⚠" text={`Error: ${error}`} accent="#ef4444" />;
  if (!camera || !layout) return <CameraStatus icon="✕" text="Camera not found." />;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="flex items-center justify-between p-[10px_20px] bg-panel border-b border-border-main shrink-0 gap-4">
        <button
          onClick={() => navigate(`/area/${areaId}`)}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[10px] text-accent bg-accent/8 border border-accent/20 rounded-md p-[3px_8px] tracking-[0.1em] shrink-0">
            CAMERA #{camera.id}
          </span>
          <span className="text-[15px] font-bold text-text-main tracking-[0.04em]">
            {camera.name}
          </span>
          {camera.des && (
            <span className="text-[12px] text-muted-main font-mono whitespace-nowrap overflow-hidden text-ellipsis">
              {camera.des}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <span className="font-mono text-[11px] text-muted-main">
            Area ID: {camera.area_id}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <CameraToolbar
          camera={camera}
          drawMode={drawing.drawMode}
          zones={zones}
          onSaveSlot={handleSaveZones}
          onStartDrawing={drawing.startDrawing}
          onCancelDrawing={drawing.cancelDrawing}
          onDeleteZone={deleteZone}
          onClearAll={clearAll}
        />

        <CameraCanvas
          imageUrl={camera.view}
          zones={zones}
          draftPoints={drawing.draftPoints}
          hoverPt={drawing.hoverPt}
          drawMode={drawing.drawMode}
          onImageClick={drawing.handleImageClick}
          onMouseMove={drawing.handleMouseMove}
        />
      </div>

      <SlotPickerModal
        layout={layout}
        assignedSlotIds={getSlotIds()}
        pendingZone={drawing.pendingZone}
        onConfirm={handleConfirmSlot}
        onCancel={drawing.dismissPending}
      />
    </div>
  );
};

export default { JSX, i18n };

interface CameraStatusProps {
  icon: string;
  text: string;
  spin?: boolean;
  accent?: string;
}

function CameraStatus({ icon, text, spin, accent = '#94a3b8' }: CameraStatusProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 font-mono text-[14px] text-muted-main">
      <span
        className={`text-[32px] block ${spin ? 'animate-spin' : ''}`}
        style={{ color: accent }}
      >
        {icon}
      </span>
      <span style={{ color: accent }}>{text}</span>
    </div>
  );
}
