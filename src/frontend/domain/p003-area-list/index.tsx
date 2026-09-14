import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { I18nDomainResource } from './i18n';
import { useAreaList, useAreaCreate, Area } from '../../global/hook/useArea';

const domainName = 'area-list';
const i18n = I18nDomainResource(domainName);

// ─── Create Modal ─────────────────────────────────────────────────────────────
const CreateModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [des,  setDes]  = useState('');
  const { mutateAsync: createArea, isPending } = useAreaCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'Name is required.', confirmButtonColor: '#3B82F6' });
      return;
    }
    try {
      await createArea({ name, des });
      Swal.fire({ icon: 'success', title: 'Created', text: 'Area created successfully.', confirmButtonColor: '#3B82F6', timer: 1500, showConfirmButton: false });
      onCreated();
      onClose();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to create area.', confirmButtonColor: '#3B82F6' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em] mb-1">Configuration</p>
        <h2 className="text-[18px] font-bold text-slate-800 mb-6">Create New Parking Zone</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. Parking Zone A"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={des} onChange={(e) => setDes(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              {isPending ? 'Creating…' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Area Card ────────────────────────────────────────────────────────────────
const AreaCard = ({ area, onClick }: { area: Area; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group flex flex-col"
  >
    <div className="p-5 flex-1">
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-md tracking-wide">
          #{area.id}
        </span>
        <span className="text-slate-300 group-hover:text-blue-400 transition-colors text-lg leading-none">›</span>
      </div>
      <h3 className="text-[15px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-tight mb-1.5">
        {area.name}
      </h3>
      <p className="text-[13px] text-slate-400 line-clamp-2 leading-relaxed">{area.des || 'No description'}</p>
    </div>
    {/* Status stripe — green if configured, gray if not */}
    <div className={`h-1 w-full ${area.area_json ? 'bg-green-400' : 'bg-slate-200'}`} />
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const AreaSidebar = ({
  areas,
  onNewArea,
  onSelectArea,
  isOpen,
  onClose,
}: {
  areas: Area[];
  onNewArea: () => void;
  onSelectArea: (id: number) => void;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <>
    {/* Mobile Backdrop */}
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
    <div className="px-4 py-3 border-b border-slate-100">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-2">Parking Zones</p>
    </div>
    <div className="flex-1 overflow-y-auto py-2 px-2">
      {areas.map((area) => (
        <button
          key={area.id}
          onClick={() => onSelectArea(area.id)}
          className="w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-2.5 transition-all text-slate-600 hover:bg-slate-50 border-l-2 border-transparent hover:border-slate-200"
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${area.area_json ? 'bg-green-500' : 'bg-slate-300'}`} />
          <span className="text-[13px] leading-tight truncate flex-1">{area.name}</span>
          <span className="text-[10px] text-slate-300 flex-shrink-0">#{area.id}</span>
        </button>
      ))}
      {areas.length === 0 && (
        <p className="text-[12px] text-slate-400 px-3 py-2">No zones yet</p>
      )}
    </div>
    <div className="p-3 border-t border-slate-100">
      <button
        onClick={onNewArea}
        className="w-full py-2 text-[13px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
      >
        + New Zone
      </button>
    </div>
  </aside>
  </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const JSX = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data, isLoading, error, refetch } = useAreaList();
  const areas = data?.data ?? [];
  const handleCreated = useCallback(() => refetch(), [refetch]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* ── Top Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <FiMenu size={20} />
          </button>
          <div>
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em]">Overview</p>
            <h1 className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-tight">Monitored Parking Zones</h1>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 lg:px-4 py-2 text-[12px] lg:text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          + New Zone
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <AreaSidebar
          areas={areas}
          onNewArea={() => setShowCreate(true)}
          onSelectArea={(id) => navigate(`/area/${id}`)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 min-w-0">
          {isLoading && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-36">
                  <div className="h-2.5 bg-slate-100 rounded w-1/4 mb-4" />
                  <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-16 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl">
              {error.message}
            </div>
          )}

          {!isLoading && !error && areas.length === 0 && (
            <div className="text-center py-20 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl bg-white">
              <p className="text-2xl mb-2">🅿️</p>
              <p className="font-medium text-slate-500">No parking zones configured</p>
              <p className="text-[12px] mt-1">Create a new zone to get started</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                + New Zone
              </button>
            </div>
          )}

          {!isLoading && areas.length > 0 && (
            <>
              <p className="text-[11px] text-slate-400 mb-4">
                {areas.length} zone{areas.length !== 1 ? 's' : ''} registered ·{' '}
                {areas.filter(a => a.area_json).length} configured
              </p>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {areas.map((area) => (
                  <AreaCard
                    key={area.id}
                    area={area}
                    onClick={() => navigate(`/area/${area.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};

export default { JSX, i18n };
