import './index.scss';

import { I18nDomainResource } from './i18n';
import { useAreaDetail } from '../../global/hook/useArea';
import { useParams, useNavigate } from 'react-router-dom';
import { useInputSession } from '../../global/hook/submit/useInputSession';
import SessionSummary from '../../global/components/submit/SessionSummary';
import SlotMapInput from '../../global/components/submit/SlotMapInput';
import CameraUploadCard from '../../global/components/submit/CameraUploadCard';
import CycleSubmitBar from '../../global/components/submit/CycleSubmitBar';

const domainName = 'session-input';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areaId = Number(id);

  const { data, isLoading, error } = useAreaDetail(areaId);

  const session = useInputSession(data?.data.area_json, areaId);
  // const cameraList = useCameraList();
  const cameraList = data?.data.cameras;

  if (session.page === 'summary') {
    return (
      <div className="flex flex-col w-full h-full overflow-hidden">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 p-2.5 px-[18px] border-b border-border bg-panel shrink-0">
          <button
            onClick={() => navigate(`/area/${areaId}`)}
            className="text-[11px] font-bold px-3 py-1 rounded border tracking-wide font-rajdhani transition-all border-border hover:bg-panel-hover text-muted hover:text-text"
          >
            ← BACK TO AREA
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-[11px] font-bold tracking-[0.16em] text-muted font-mono uppercase">
            SUBMIT RESULT
          </span>
        </div>
        <SessionSummary
          session={session.lastSession}
          layout={session.layout}
          onNewCycle={session.newCycle}
        />
      </div>
    );
  }

  const uploadedCount = Object.keys(session.cameraImages).length;

  if (isLoading || error || !cameraList) {
    return <div>Loading ...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 p-2.5 px-[18px] border-b border-border bg-panel shrink-0">
        <button
          onClick={() => navigate(`/area/${areaId}`)}
          className="text-[11px] font-bold px-3 py-1 rounded border tracking-wide font-rajdhani transition-all border-border hover:bg-panel-hover text-muted hover:text-text"
        >
          ← BACK TO AREA
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-[11px] font-bold tracking-[0.16em] text-muted font-mono uppercase">
          NEW SESSION INPUT
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT — Slot status map */}
        <div className="flex-[1.4] flex flex-col border-r border-border overflow-hidden min-w-0">
          <div className="flex items-center justify-between p-2.5 px-[18px] border-b border-border bg-panel shrink-0 gap-3">
            <span className="text-[11px] font-bold tracking-[0.16em] text-muted font-mono">
              SLOT STATUS
            </span>
            <div className="flex gap-1.5">
              <button
                className="text-[11px] font-bold px-3 py-1 rounded border tracking-wide font-rajdhani transition-all color-green border-green/30 bg-green/6 hover:bg-green/14 text-green"
                onClick={session.setAllFree}
              >
                All Free
              </button>
              <button
                className="text-[11px] font-bold px-3 py-1 rounded border tracking-wide font-rajdhani transition-all color-red border-red/30 bg-red/6 hover:bg-red/14 text-red"
                onClick={session.setAllOccupied}
              >
                All Occupied
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 min-h-0 overflow-hidden">
            <SlotMapInput
              layout={session.layout}
              slotStatuses={session.slotStatuses}
              onToggle={session.toggleSlot}
            />
          </div>
          <div className="p-2 px-[18px] text-[11px] text-muted font-mono border-t border-border shrink-0">
            Click a slot to toggle <span className="text-green">Free</span> /{' '}
            <span className="text-red">Occupied</span>
          </div>
        </div>

        {/* RIGHT — Camera uploads */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between p-2.5 px-[18px] border-b border-border bg-panel shrink-0 gap-3">
            <span className="text-[11px] font-bold tracking-[0.16em] text-muted font-mono uppercase">
              CAMERA FRAMES
            </span>
            <span className="text-[11px] font-mono text-muted">
              {uploadedCount}/{cameraList.length} uploaded
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {cameraList.length === 0 ? (
              <div className="text-xs text-muted font-mono text-center leading-loose p-8 px-4">
                No cameras with zone mappings found.
                <br />
                Map zones on a camera page first (e.g.{' '}
                <code className="text-accent bg-accent/8 px-1.5 py-[1px] rounded">
                  /camera/1
                </code>
                ).
              </div>
            ) : (
              cameraList.map(({ id }) => (
                <CameraUploadCard
                  key={id}
                  cameraId={id.toString()}
                  // zones={zones}
                  imageData={session.cameraImages[id] ?? null}
                  onUpload={session.setCameraImage}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <CycleSubmitBar
        stats={session.stats}
        cameraCount={cameraList.length}
        uploadedCount={uploadedCount}
        onSubmit={session.submit}
        submitting={session.submitting}
      />
    </div>
  );
};

export default { JSX, i18n };
