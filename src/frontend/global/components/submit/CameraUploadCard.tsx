import { useRef, useState } from 'react';
// import { Zone } from '../types';
// import { CameraZone } from '../../../../types/types';

interface CameraUploadCardProps {
  cameraId: string;
  // zones: CameraZone[];
  imageData: { name: string; dataUrl: string } | null;
  onUpload: (cameraId: string, file: File | null) => void;
}

export default function CameraUploadCard({
  cameraId,
  // zones,
  imageData,
  onUpload,
}: CameraUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    onUpload(cameraId, file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload(cameraId, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-panel border border-border rounded-lg overflow-hidden flex flex-col gap-0">
      <div className="flex items-center justify-between p-2 px-3 border-bottom border-border border-b">
        <span className="font-mono text-xs text-accent font-bold tracking-widest uppercase">
          CAM #{cameraId}
        </span>
        {/* <span className="text-[10px] text-muted font-mono">
          {zones.length} zone{zones.length !== 1 ? 's' : ''} mapped
        </span> */}
      </div>

      <div
        className={`relative h-[140px] flex items-center justify-center cursor-pointer border-b border-border bg-[#d4e4ff] transition-colors overflow-hidden
          ${!imageData ? 'hover:bg-accent/4' : ''}
          ${drag ? 'bg-accent/8 outline-accent outline-2 outline-dashed -outline-offset-4' : ''}`}
        onClick={() => !imageData && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        {imageData ? (
          <>
            <img
              src={imageData.dataUrl}
              alt="frame"
              className="w-full h-full object-cover block"
            />
            <div className="absolute inset-0 bg-[#0a0c10]/60 flex flex-col items-center justify-end p-2 gap-[5px] opacity-0 transition-opacity hover:opacity-100">
              <span className="text-[10px] font-mono text-text text-center truncate max-w-full">
                {imageData.name}
              </span>
              <button
                className="bg-red/20 text-red border border-red/30 rounded px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer transition-colors hover:bg-red/35"
                onClick={handleClear}
              >
                ✕ Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-[5px] pointer-events-none">
            <span className="text-[22px] text-muted">⬆</span>
            <span className="text-xs text-muted font-semibold">
              Drop frame or click to upload
            </span>
            <span className="text-[10px] text-[#2a3545] font-mono">
              JPG / PNG · 1 frame per cycle
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFile(e.target.files[0]);
        }}
      />

      {/* Zone tags */}
      {/* <div className="flex flex-wrap gap-1 p-2 px-2.5">
        {zones.map((z) => (
          <span
            key={z.id}
            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide"
            style={{ borderColor: z.color, color: z.color }}
          >
            {z.slotLabel}
          </span>
        ))}
      </div> */}
    </div>
  );
}
