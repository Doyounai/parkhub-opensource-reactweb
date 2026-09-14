import { useState } from 'react';
import { useCameraCreate } from '../../../global/hook/camera/useCamera';
import Swal from 'sweetalert2';

const CameraCreate = (props: {
  areaId: number;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const { areaId, onClose, onCreated } = props;

  const [name, setName] = useState('');
  const [des, setDes] = useState('');

  const { mutateAsync: createCamera, isPending } = useCameraCreate();
  const [image, setImage] = useState<File | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Name is required.',
        confirmButtonColor: '#1f2937',
      });
      return;
    }
    try {
      const fd = new FormData();

      // fields (must match your NestJS DTO/body keys)
      fd.append('name', name);
      fd.append('des', des || '');
      fd.append('area_id', areaId.toString());

      // file field name MUST match FileInterceptor('image')
      if (image) {
        fd.append('image', image);
      }

      // await createCamera({ name, des, area_id: areaId });
      await createCamera(fd);
      Swal.fire({
        icon: 'success',
        title: 'Created',
        text: 'Area created successfully.',
        confirmButtonColor: '#1f2937',
        timer: 1500,
        showConfirmButton: false,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to create area.',
        confirmButtonColor: '#1f2937',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-gray-300 rounded-sm shadow-lg w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Camera</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-gray-900 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={des}
              onChange={(e) => setDes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-gray-900 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0])}
              className="w-full border rounded px-2 py-1"
            />
            {/* {errors.image && <div className="text-red-600 text-sm mt-1">{errors.image}</div>} */}
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CameraCreate;
