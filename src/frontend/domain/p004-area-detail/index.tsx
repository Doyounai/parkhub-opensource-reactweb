import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { I18nDomainResource } from './i18n';
import { useAreaDetail, useAreaUpdate, useAreaDelete, useAreaList } from '../../global/hook/useArea';
import CameraList from './ui/camera-list';
import { LiveViewer3D } from './ui/live-viewer';
import SubmitList from './ui/submit-list';
import KpiCards from '../p009-area-analytics/ui/kpi-cards';
import { useAnalyticsSummary, useOccupancyTimeline } from '../../global/hook/useAnalytics';

const toIso = (d: Date) => d.toISOString();
const nowIso = () => toIso(new Date());
const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIso(d);
};

const domainName = 'area-detail';
const i18n = I18nDomainResource(domainName);

// ─── Shared Sidebar ───────────────────────────────────────────────────────────
const AreaSidebar = ({ currentId, isOpen, onClose }: { currentId: number; isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { data } = useAreaList();
  const areas = data?.data ?? [];
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform w-60 bg-white border-r border-slate-200 flex flex-col h-full lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-4 py-5 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-1">System</p>
        <p className="text-[15px] font-bold text-slate-800">ParkHub Digital Twin</p>
      </div>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">Parking Zones</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => navigate(`/area/${area.id}`)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-2.5 transition-all ${
              area.id === currentId
                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${area.area_json ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-[13px] leading-tight truncate flex-1">{area.name}</span>
            <span className={`text-[10px] flex-shrink-0 ${area.id === currentId ? 'text-blue-400' : 'text-slate-300'}`}>#{area.id}</span>
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/area')}
          className="w-full py-2 text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          ← All Zones
        </button>
      </div>
    </aside>
    </>
  );
};

// ─── Section Card Wrapper ─────────────────────────────────────────────────────
const SectionCard = ({
  section, title, children, className = '',
}: { section: string; title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-shrink-0 ${className}`}>
    <div className="px-5 pt-4 pb-3 border-b border-slate-100">
      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-0.5">{section}</p>
      <h3 className="text-[14px] font-semibold text-slate-800 leading-tight">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const JSX = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areaId = Number(id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data, isLoading, error, refetch } = useAreaDetail(areaId);
  const { mutateAsync: updateArea, isPending: isUpdating } = useAreaUpdate();
  const { mutateAsync: deleteArea, isPending: isDeleting } = useAreaDelete();

  // Analytics Data for KPI Cards (Last 7 days)
  // Use state so `nowIso()` isn't re-evaluated on every render causing an infinite refetch loop
  const [analyticsParams] = useState({
    from: daysAgoIso(30),
    to: nowIso(),
    granularity: 'hour' as const,
  });
  const summary = useAnalyticsSummary(areaId, analyticsParams);
  const timeline = useOccupancyTimeline(areaId, analyticsParams);

  const area = data?.data;
  const [name, setName]     = useState('');
  const [des,  setDes]      = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (area) { setName(area.name); setDes(area.des); setIsDirty(false); }
  }, [area]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'Name is required.', confirmButtonColor: '#3B82F6' });
      return;
    }
    try {
      await updateArea({ id: areaId, body: { name, des } });
      setIsDirty(false);
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Area updated successfully.', confirmButtonColor: '#3B82F6', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to update.', confirmButtonColor: '#3B82F6' });
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      icon: 'warning', title: 'Delete Zone',
      text: `Are you sure you want to delete "${area?.name}"? This cannot be undone.`,
      showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444', cancelButtonColor: '#94A3B8',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteArea(areaId);
      Swal.fire({ icon: 'success', title: 'Deleted', confirmButtonColor: '#3B82F6', timer: 1500, showConfirmButton: false });
      navigate('/area');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to delete.', confirmButtonColor: '#3B82F6' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <FiMenu size={20} />
          </button>
          <button onClick={() => navigate('/area')} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Back
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em]">Area Configuration</p>
            <h1 className="text-[18px] font-bold text-slate-800 leading-tight truncate">
              {isLoading ? 'Loading…' : (area?.name ?? 'Area Detail')}
            </h1>
            <p className="text-xs text-slate-400">Zone #{areaId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/area/${id}/dashboard`)}
            className="px-3 py-2 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            Executive Dashboard
          </button>
          <button
            onClick={() => navigate(`/area/${id}/analytics`)}
            className="px-3 py-2 text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            Analytics ↗
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <AreaSidebar currentId={areaId} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-w-0">

          {isLoading && (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading area…</div>
          )}
          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-6 py-4">{error.message}</div>
            </div>
          )}

          {!isLoading && area && (
            <>
              {/* ── Left: Canvas Panel ── */}
              <div className="flex-1 flex flex-col p-4 lg:p-5 min-w-0 gap-5 lg:overflow-y-auto">
                <KpiCards
                  data={summary.data?.data}
                  timeline={timeline.data?.data}
                  isLoading={summary.isLoading || timeline.isLoading}
                />

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
                  {/* Canvas Card Header */}
                  <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
                    <div>
                      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-0.5">
                        Section A — Configuration Workspace
                      </p>
                      <h3 className="text-[14px] font-semibold text-slate-800 leading-tight">Parking Layout</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Real-time slot map · read-only view</p>
                    </div>
                    <button
                      onClick={() => navigate(`/area/${id}/editor`)}
                      className="text-[12px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      Edit Layout →
                    </button>
                  </div>

                  {/* Canvas Body */}
                  <div className="flex-1 bg-slate-50 relative min-h-0">
                    {area.area_json ? (
                      <LiveViewer3D areaId={areaId} layout={area.area_json} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-3">
                        <p className="text-slate-400 text-sm">No layout configured yet</p>
                        <button
                          onClick={() => navigate(`/area/${id}/editor`)}
                          className="px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          Configure Layout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Canvas Footer — Status Legend */}
                  <div className="flex-shrink-0 px-5 py-3 border-t border-slate-100 flex items-center gap-5 bg-white">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                      <span className="text-[12px] font-medium text-slate-600">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                      <span className="text-[12px] font-medium text-slate-600">Occupied</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: Module Cards ── */}
              <div className="w-full lg:w-120 flex-shrink-0 flex flex-col gap-0 lg:overflow-y-auto p-5 lg:pl-0 space-y-4">

                {/* Section B — Configuration Form */}
                <SectionCard section="Section B — Configuration" title="Edit Zone Details">
                  <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Name</label>
                      <input
                        type="text" value={name}
                        onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Description</label>
                      <textarea
                        value={des} rows={3}
                        onChange={(e) => { setDes(e.target.value); setIsDirty(true); }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit" disabled={isUpdating || !isDirty}
                        className="px-4 py-2 text-[12px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {isUpdating ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </SectionCard>

                {/* Section C — Camera Feeds */}
                <SectionCard section="Section C — Camera Integration" title="Camera Feeds">
                  <CameraList area={area} refetch={refetch} />
                </SectionCard>

                {/* Section D — Session History */}
                <SectionCard section="Section D — Operational Data" title="Session History">
                  <SubmitList areaId={areaId} />
                </SectionCard>

                {/* Section E — Danger Zone */}
                <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                  <div className="px-5 pt-4 pb-3 border-b border-red-100 bg-red-50/50">
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-[0.1em] mb-0.5">Section E — Danger Zone</p>
                    <h3 className="text-[14px] font-semibold text-red-700 leading-tight">Delete Zone</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
                      Permanently deletes this zone and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleDelete} disabled={isDeleting}
                      className="w-full py-2 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                    >
                      {isDeleting ? 'Deleting…' : 'Delete Zone'}
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default { JSX, i18n };
