import { useRef, useState, useEffect, useCallback } from 'react'
// import { loadLayout } from '../utils/storage'
// import { useThreeScene } from '../hooks/useThreeScene'
// import { Layout, Slot } from '../types'
import { Layout, Slot } from '../../../../types/types'
import { useThreeScene } from '../../../global/hook/editor/useThreeScene'

export const EditorViewer = (props: {
    layout: any;
}) => {
    const mountRef = useRef<HTMLDivElement>(null)
    const [layout, setLayout] = useState<Layout>(props.layout || { area: [], slots: [] })

    const handleSlotToggle = useCallback((slotId: string) => {
        setLayout(prev => {
            const next: Layout = {
                ...prev,
                slots: prev.slots.map(s =>
                    s.label !== slotId ? s : { ...s, occupied: !s.occupied }
                )
            }
            return next
        })
    }, [])

    const { handleClick, syncOccupied } = useThreeScene(mountRef, layout, handleSlotToggle)

    // Sync only occupied state changes after initial build
    useEffect(() => {
        if (syncOccupied) syncOccupied(layout.slots)
    }, [layout.slots, syncOccupied])

    // Reload from storage when tab becomes visible
    // useEffect(() => {
    //     const stored = loadLayout()
    //     if (stored) setLayout(stored)
    // }, [])

    const total = layout.slots.length
    const occupied = layout.slots.filter(s => s.occupied).length
    const free = total - occupied

    return (
        <div className="w-full h-full relative overflow-hidden">
            <div ref={mountRef} className="w-full h-full cursor-pointer" onClick={(e) => handleClick(e as any)} />
            <ViewerHUD total={total} occupied={occupied} free={free} slots={layout.slots} onToggle={handleSlotToggle} />
        </div>
    )
}

interface ViewerHUDProps {
    total: number;
    occupied: number;
    free: number;
    slots: Slot[];
    onToggle: (id: string) => void;
}

function ViewerHUD({ total, occupied, free, slots, onToggle }: ViewerHUDProps) {
    return (
        <div className="absolute top-4 right-4 pointer-events-none z-10">
            <div className="border border-gray-300 rounded-lg p-4 min-w-[200px] max-w-[240px] backdrop-blur-[12px] pointer-events-auto flex flex-col gap-3 bg-white/90">
                <div className="text-[11px] font-bold tracking-[0.2em] text-blue-600 font-mono border-b border-gray-300 pb-2 uppercase">
                    DIGITAL TWIN
                </div>
                <div className="flex gap-3">
                    <Stat label="TOTAL" value={total} color="text-blue-600" />
                    <Stat label="OCCUPIED" value={occupied} color="text-red-600" />
                    <Stat label="FREE" value={free} color="text-green-600" />
                </div>

                {total > 0 && (
                    <div className="h-1 bg-gray-300 rounded overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded transition-all duration-400 ease-out"
                            style={{ width: `${total > 0 ? (occupied / total) * 100 : 0}%` }}
                        />
                    </div>
                )}

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {slots.map(s => (
                        <button
                            key={s.id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.06em] border cursor-pointer transition-all duration-150 font-mono ${s.occupied
                                ? 'bg-red-50 border-red-200 text-red-600 hover:brightness-110 hover:scale-105'
                                : 'bg-green-50 border-green-200 text-green-600 hover:brightness-110 hover:scale-105'
                                }`}
                            onClick={() => onToggle(s.label)}
                            title={`Click to ${s.occupied ? 'free' : 'occupy'} slot ${s.label}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {s.label}
                        </button>
                    ))}
                </div>

                {total === 0 && (
                    <div className="text-[11px] text-gray-500 leading-relaxed text-center py-2 font-mono">
                        No slots found. Draw a layout in the Editor first.
                    </div>
                )}

                <div className="text-[10px] text-gray-700 font-mono leading-relaxed border-t border-gray-300 pt-2">
                    Click any slot in 3D or above to toggle occupancy
                </div>
            </div>
        </div>
    )
}

interface StatProps {
    label: string;
    value: number;
    color: string;
}

function Stat({ label, value, color }: StatProps) {
    return (
        <div className="flex-1 text-center">
            <div className={`text-2xl font-bold font-mono leading-none ${color}`}>{value}</div>
            <div className="text-[9px] text-gray-500 tracking-[0.15em] mt-1 font-mono uppercase">{label}</div>
        </div>
    )
}
