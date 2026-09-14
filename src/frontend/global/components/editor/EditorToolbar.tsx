// import { MODES } from '../hooks/useEditorState'
// import { Mode, Layout, Slot } from '../types'
// import './EditorToolbar.css'
import { useRef } from 'react';
import { MODES } from '../../hook/editor/useEditorState';
import { Layout, Mode, Slot, GuideImage } from '../../../../types/types';

interface EditorToolbarProps {
  mode: Mode;
  selectedSlot: Slot | null;
  layout: Layout;
  showLabelInput: boolean;
  editLabel: string;
  setEditLabel: (label: string) => void;
  onStartDrawArea: () => void;
  onStartDrawSlot: () => void;
  onCancelDraw: () => void;
  onSetMode: (mode: Mode) => void;
  onDeleteSelected: () => void;
  onOpenLabelEdit: () => void;
  onRenameSelected: (label: string) => void;
  onClearArea: () => void;
  onClearAll: () => void;
  onSaveArea: () => void;
  setShowLabelInput: (show: boolean) => void;
  guideImage: GuideImage | null;
  setGuideImage: React.Dispatch<React.SetStateAction<GuideImage | null>>;
}

export default function EditorToolbar({
  mode,
  selectedSlot,
  layout,
  showLabelInput,
  editLabel,
  setEditLabel,
  onStartDrawArea,
  onStartDrawSlot,
  onCancelDraw,
  onSetMode,
  onDeleteSelected,
  onOpenLabelEdit,
  onRenameSelected,
  onClearArea,
  onClearAll,
  setShowLabelInput,
  onSaveArea,
  guideImage,
  setGuideImage,
}: EditorToolbarProps) {
  const isDrawing = mode === MODES.DRAW_AREA || mode === MODES.DRAW_SLOT;
  const hasArea = layout.area.length >= 3;
  const hasSelection = !!selectedSlot;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setGuideImage({
          url,
          element: img,
          x: 0,
          y: 0,
          scale: 1,
          opacity: 0.5,
        });
      };
    }
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuideImage((prev) => (prev ? { ...prev, scale: parseFloat(e.target.value) } : null));
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuideImage((prev) => (prev ? { ...prev, opacity: parseFloat(e.target.value) } : null));
  };

  const removeGuideImage = () => {
    setGuideImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mode === MODES.MOVE_IMAGE) onSetMode(MODES.IDLE as Mode);
  };

  return (
    <aside className="w-64 min-w-[256px] bg-white border-r border-gray-300 flex flex-col py-4 overflow-y-auto z-10">
      {/* Guide Image Section */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1 font-mono">
          GUIDE IMAGE
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-sm font-semibold text-left bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-base w-5 text-center leading-none">🖼</span>
          {guideImage ? 'Change Image' : 'Upload Image'}
        </button>

        {guideImage && (
          <div className="mt-2 flex flex-col gap-3 bg-gray-50 p-3 rounded border border-gray-200">
            <button
              className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border transition-all text-xs font-semibold ${
                mode === MODES.MOVE_IMAGE
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
              onClick={() =>
                onSetMode(mode === MODES.MOVE_IMAGE ? (MODES.IDLE as Mode) : (MODES.MOVE_IMAGE as Mode))
              }
            >
              <span className="text-center">⤢</span> Move Image
            </button>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Scale</span>
                <span>{guideImage.scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={guideImage.scale}
                onChange={handleScaleChange}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Opacity</span>
                <span>{Math.round(guideImage.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={guideImage.opacity}
                onChange={handleOpacityChange}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              className="flex items-center gap-2 px-2 py-1.5 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors mt-1 rounded-sm"
              onClick={removeGuideImage}
            >
              <span className="text-center">✕</span> Remove
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-200 my-2 mx-4" />

      {/* Area Section */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1 font-mono">
          AREA
        </div>
        <button
          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-sm font-semibold text-left ${
            mode === MODES.DRAW_AREA
              ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={mode === MODES.DRAW_AREA ? onCancelDraw : onStartDrawArea}
          title="Draw parking area boundary"
        >
          <span className="text-base w-5 text-center leading-none">⬡</span>
          {mode === MODES.DRAW_AREA ? 'Cancel' : hasArea ? 'Redraw Area' : 'Draw Area'}
        </button>
        {hasArea && (
          <>
            <button
              className="flex items-center gap-3 px-3 py-2 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors mt-1"
              onClick={onClearArea}
            >
              <span className="w-5 text-center">✕</span> Clear Area
            </button>
            <button
              className="flex items-center gap-3 px-3 py-2 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors mt-1"
              onClick={onSaveArea}
            >
              <span className="w-5 text-center">💾</span> Save Area
            </button>
          </>
        )}
      </div>

      <div className="h-px bg-gray-200 my-2 mx-4" />

      {/* Slots Section */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1 font-mono">
          SLOTS
        </div>
        <button
          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-sm font-semibold text-left disabled:opacity-30 disabled:cursor-not-allowed ${
            mode === MODES.DRAW_SLOT
              ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={mode === MODES.DRAW_SLOT ? onCancelDraw : onStartDrawSlot}
          title="Draw a 4-corner parking slot"
          disabled={!hasArea}
        >
          <span className="text-base w-5 text-center leading-none">⊡</span>
          {mode === MODES.DRAW_SLOT ? 'Cancel (4 pts)' : 'Add Slot'}
        </button>
        <div className="text-[11px] text-gray-500 font-mono mt-1 px-1">
          {mode === MODES.DRAW_SLOT ? (
            <>
              <span className="text-blue-600 font-bold">Click 4 corners</span> to define
            </>
          ) : (
            `${layout.slots.length} slot${layout.slots.length !== 1 ? 's' : ''} placed`
          )}
        </div>
      </div>

      <div className="h-px bg-gray-200 my-2 mx-4" />

      {/* Select & Edit Section */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1 font-mono">
          SELECT & EDIT
        </div>
        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all text-sm font-semibold text-left disabled:opacity-30 ${
            mode === MODES.IDLE
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => onSetMode(MODES.IDLE as Mode)}
          disabled={isDrawing}
        >
          <span className="text-base w-5 text-center">↖</span> Select
        </button>
        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all text-sm font-semibold text-left disabled:opacity-30 ${
            mode === MODES.MOVE
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() =>
            onSetMode(mode === MODES.MOVE ? (MODES.IDLE as Mode) : (MODES.MOVE as Mode))
          }
          disabled={isDrawing || !hasSelection}
        >
          <span className="text-base w-5 text-center">⤢</span> Move Slot
        </button>
      </div>

      {hasSelection && selectedSlot && (
        <>
          <div className="h-px bg-gray-200 my-2 mx-4" />
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase font-mono">
              SELECTED: <span className="text-blue-600">{selectedSlot.label}</span>
            </div>

            {showLabelInput ? (
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onRenameSelected(editLabel);
                    if (e.key === 'Escape') setShowLabelInput(false);
                  }}
                  autoFocus
                  maxLength={10}
                  placeholder="Label..."
                />
                <button
                  className="px-2 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-sm hover:bg-blue-700 transition-colors"
                  onClick={() => onRenameSelected(editLabel)}
                >
                  ✓
                </button>
                <button
                  className="px-2 py-1.5 text-xs font-bold text-gray-500 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                  onClick={() => setShowLabelInput(false)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="flex items-center gap-3 px-3 py-2 bg-white text-gray-700 text-sm font-semibold border border-gray-200 rounded-sm hover:border-gray-400 hover:bg-gray-50 transition-all"
                onClick={onOpenLabelEdit}
              >
                <span className="w-5 text-center">✎</span> Rename
              </button>
            )}

            <button
              className="flex items-center gap-3 px-3 py-2 bg-red-50 text-red-600 text-sm font-semibold border border-red-100 rounded-sm hover:bg-red-100 transition-all mt-1"
              onClick={onDeleteSelected}
            >
              <span className="w-5 text-center font-bold">⊗</span> Delete Slot
            </button>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Summary Section */}
      <div className="px-4 py-4 mt-auto">
        <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2 font-mono">
          LAYOUT
        </div>
        <div className="font-mono text-2xl font-bold text-gray-900 tracking-wider mb-3">
          {layout.slots.length}{' '}
          <span className="text-xs text-gray-400 font-normal">SLOTS</span>
        </div>
        {/*  */}

        <button
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-red-600 text-xs font-bold border border-red-200 rounded-sm hover:bg-red-50 transition-colors"
          onClick={onClearAll}
        >
          ⚠ Reset All
        </button>
      </div>

      <div className="h-px bg-gray-200 my-2 mx-4" />
      <div className="px-4 py-3 pb-6">
        <div className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2 font-mono">
          NAVIGATION
        </div>
        <div className="text-[10px] text-gray-500 font-mono leading-relaxed space-y-1">
          <div>
            • Scroll to <span className="text-gray-700 font-bold">Zoom</span>
          </div>
          <div>
            • Alt + Drag to <span className="text-gray-700 font-bold">Pan</span>
          </div>
          <div>
            • Mid-Click to <span className="text-gray-700 font-bold">Pan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
