import { useRef, useState, useEffect, useMemo } from 'react';
import { Layout, Slot } from '../../../../types/types';
import { useLiveThreeScene } from '../../../global/hook/editor/useLiveThreeScene';
import { useSlotLatestStatus } from '../../../global/hook/useSlot';

interface LiveViewerProps {
  areaId: number;
  layout: Layout;
}

export const LiveViewer3D = ({ areaId, layout }: LiveViewerProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Keep the base layout stable so we don't rebuild the 3D scene every 5 seconds
  const stableLayout = useMemo(() => layout || { area: [], slots: [] }, [layout]);
  const [liveSlots, setLiveSlots] = useState<Slot[]>(stableLayout.slots);

  // Fetch real-time status
  const { data: statusResponse, isLoading } = useSlotLatestStatus(areaId);

  // Initialize the 3D scene (no click handler)
  const { syncOccupied } = useLiveThreeScene(mountRef, stableLayout);

  // Sync API data to 3D scene and HUD
  useEffect(() => {
    if (statusResponse?.data) {
      const apiData = statusResponse.data;
      
      // Update slots with their live occupied status
      const updatedSlots = stableLayout.slots.map(s => {
        const liveStatus = apiData.find(d => String(d.name) === String(s.label));
        return {
          ...s,
          occupied: liveStatus ? liveStatus.status === 'occupied' : !!s.occupied
        };
      });
      
      setLiveSlots(updatedSlots);
      
      // Update 3D scene without rebuilding geometries
      if (syncOccupied) {
        syncOccupied(updatedSlots);
      }
    }
  }, [statusResponse?.data, stableLayout.slots, syncOccupied]);

  const total = liveSlots.length;
  const occupied = liveSlots.filter(s => s.occupied).length;
  const free = total - occupied;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#f8fafc]">
      <div ref={mountRef} className="w-full h-full" />
      <ViewerHUD 
        total={total} 
        occupied={occupied} 
        free={free} 
        isLoading={isLoading} 
      />
    </div>
  );
};

interface ViewerHUDProps {
  total: number;
  occupied: number;
  free: number;
  isLoading: boolean;
}

function ViewerHUD({ total, occupied, free, isLoading }: ViewerHUDProps) {
  return (
    <div className="absolute top-4 right-4 pointer-events-none z-10">
      <div className="border border-slate-200 rounded-xl p-4 min-w-[200px] pointer-events-auto flex flex-col gap-3 bg-white shadow-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="text-[11px] font-bold tracking-wide text-slate-800 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Overview
          </div>
          {isLoading && <div className="text-[10px] text-slate-400">Syncing...</div>}
        </div>
        
        {/* Stats */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-semibold text-slate-500">Total slots</span>
            <span className="text-[14px] font-bold text-slate-800 font-mono">{total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-semibold text-slate-500">Occupied</span>
            <span className="text-[14px] font-bold text-red-500 font-mono">{`${occupied}(${((occupied / total) * 100).toFixed(0)}%)`}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-semibold text-slate-500">Available</span>
            <span className="text-[14px] font-bold text-green-500 font-mono">{`${free}(${((free / total) * 100).toFixed(0)}%)`}</span>
          </div>
        </div>

        {total === 0 && (
          <div className="text-[11px] text-slate-500 leading-relaxed text-center py-2">
            No slots configured.
          </div>
        )}
      </div>
    </div>
  );
}
