// import './index.scss';
import { I18nDomainResource } from './i18n';
import { MODES, useEditorState } from '../../global/hook/editor/useEditorState';
import { Mode } from '../../../types/types';
import EditorToolbar from '../../global/components/editor/EditorToolbar';
import ParkingCanvas from '../../global/components/editor/ParkingCanvas';
import { useAreaDetail, useAreaUpdate } from '../../global/hook/useArea';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';

const domainName = 'area-editor';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areaId = Number(id);

  const { mutateAsync: updateArea, isPending: isUpdating } = useAreaUpdate();
  const { data } = useAreaDetail(areaId);
  const state = useEditorState(data?.data.area_json);

  const handleUpdate = async () => {
    try {
      await updateArea({ id: areaId, body: { area_json: state.layout } });
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Area updated successfully.',
        confirmButtonColor: '#1f2937',
        showConfirmButton: true,
      }).then(() => {
        navigate(`/area/${id}`);
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to update area.',
        confirmButtonColor: '#1f2937',
      });
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-gray-50 font-sans text-gray-900">
      <EditorToolbar
        mode={state.mode}
        selectedSlot={state.selectedSlot}
        layout={state.layout}
        showLabelInput={state.showLabelInput}
        editLabel={state.editLabel}
        setEditLabel={state.setEditLabel}
        setShowLabelInput={state.setShowLabelInput}
        onStartDrawArea={state.startDrawArea}
        onStartDrawSlot={state.startDrawSlot}
        onCancelDraw={state.cancelDraw}
        onSetMode={state.setMode}
        onDeleteSelected={state.deleteSelected}
        onOpenLabelEdit={state.openLabelEdit}
        onRenameSelected={state.renameSelected}
        onClearArea={state.clearArea}
        onClearAll={state.clearAll}
        onSaveArea={handleUpdate}
        guideImage={state.guideImage}
        setGuideImage={state.setGuideImage}
      />

      <div className="flex-1 relative flex overflow-hidden">
        <ParkingCanvas
          layout={state.layout}
          draftPoints={state.draftPoints}
          hoverPt={state.hoverPt}
          selectedId={state.selectedId}
          mode={state.mode}
          offset={state.offset}
          scale={state.scale}
          onCanvasClick={state.handleCanvasClick}
          onMouseMove={state.handleMouseMove}
          onMouseDown={state.handleMouseDown}
          onMouseUp={state.handleMouseUp}
          onPan={state.handlePan}
          onZoom={state.handleZoom}
          guideImage={state.guideImage}
        />

        {isUpdating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-900 font-medium">Updating...</span>
            </div>
          </div>
        )}

        <ModeHUD mode={state.mode} draftCount={state.draftPoints.length} />
      </div>
    </div>
  );
};

export default { JSX, i18n };

interface ModeHUDProps {
  mode: Mode;
  draftCount: number;
}

function ModeHUD({ mode, draftCount }: ModeHUDProps) {
  const messages: Partial<Record<Mode, string | null>> = {
    [MODES.DRAW_AREA]: `Drawing area boundary — click to place points · snap near first point to close`,
    [MODES.DRAW_SLOT]: `Drawing slot — click 4 corner points (${draftCount}/4 placed)`,
    [MODES.MOVE]: `Move mode — click a slot then drag to reposition`,
    [MODES.MOVE_IMAGE]: `Move image mode — drag the canvas to reposition the guide image`,
    idle: null,
    select: null,
  };
  const msg = messages[mode];
  if (!msg) return null;
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-gray-700 text-white font-mono text-xs px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-md pointer-events-none whitespace-nowrap z-50">
      <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse shrink-0" />
      {msg}
    </div>
  );
}
