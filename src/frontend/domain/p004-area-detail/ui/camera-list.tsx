import { useState } from "react";
import { Camera } from "../../../global/hook/camera/useCamera";
import { Area } from "../../../global/hook/useArea";
import CameraCreate from "./camera-create";
import { useNavigate } from "react-router-dom";

const CameraList = (props: {
    area: Area;
    refetch: () => void;
}) => {
    const { area, refetch } = props;
    const navigate = useNavigate();
    const cameras = area.cameras ?? [];

    const [showCreate, setShowCreate] = useState(false);

    return (
        <div className="bg-white border border-gray-300 rounded-sm shadow-sm p-8">
            <h2 className="text-base font-semibold text-gray-900 mb-6">
                Cameras
                <span className="ml-2 text-xs font-normal text-gray-400">({cameras.length})</span>
            </h2>

            {cameras.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-sm">
                    No cameras added yet.
                </div>
            ) : (
                <div className="flex flex-col space-y-2">
                    {cameras.map((camera) => (
                        <CameraCard
                            key={camera.id}
                            camera={camera}
                            onClick={() => { 
                                navigate(`/area/${camera.area_id}/camera/${camera.id}`);
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="w-full flex justify-end mt-5">
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-sm hover:bg-gray-800 transition-colors"
                >
                    + New Camera
                </button>
            </div>

            {showCreate && (
                <CameraCreate
                    areaId={area.id}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        setShowCreate(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
};

const CameraCard = (props: {
    camera: Camera;
    onClick: () => void;
}) => {
    const { camera, onClick } = props;

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-300 rounded-sm p-5 cursor-pointer hover:border-gray-500 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Camera #{camera.id}
                    </p>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {camera.name}
                    </h3>
                    {camera.des && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{camera.des}</p>
                    )}
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-xl">›</span>
            </div>
        </div>
    );
};

export default CameraList;
