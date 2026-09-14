import { useParams, useNavigate } from 'react-router-dom';
import { I18nDomainResource } from './i18n';
import { useAreaSessionDetail } from '../../global/hook/submit/useAreaSession';

const domainName = 'area-session-detail';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  const { id: areaId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useAreaSessionDetail(Number(sessionId));
  const session = data?.data;

  return (
    <div className="max-h-full h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 shadow-md z-50">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(`/area/${areaId}`)}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Area
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isLoading ? 'Loading...' : `Session #${sessionId}`}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {session?.created_at
                ? new Date(session.created_at).toLocaleString()
                : `Area #${areaId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-6 py-8">
        {isLoading && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Loading session details...
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-600 text-sm bg-red-50 border border-red-200 rounded-sm">
            {error.message || 'Failed to load session details.'}
          </div>
        )}

        {!isLoading && session && (
          <div className="flex flex-col gap-8">
            
            {/* Camera Views */}
            <div className="bg-white border border-gray-300 rounded-sm shadow-sm p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Camera Views</h2>
              {session.cameraSessions?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {session.cameraSessions.map((cam) => (
                    <div key={cam.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-medium text-gray-700">
                          Camera #{cam.camera_id}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          Detect: {cam.detect ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="w-full aspect-video bg-gray-100 border border-gray-200 rounded-sm overflow-hidden relative group">
                        <img 
                          src={cam.view} 
                          alt={`Camera ${cam.camera_id} view`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-sm">
                  No camera views available for this session.
                </div>
              )}
            </div>

            {/* Slot Events */}
            <div className="bg-white border border-gray-300 rounded-sm shadow-sm p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Slot Events</h2>
              {session.slotEvents?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th scope="col" className="px-6 py-3">Event ID</th>
                        <th scope="col" className="px-6 py-3">Slot ID</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Type</th>
                        <th scope="col" className="px-6 py-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.slotEvents.map((evt) => (
                        <tr key={evt.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">#{evt.id}</td>
                          <td className="px-6 py-4">#{evt.slot_id}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              evt.status === 'empty' ? 'bg-green-100 text-green-800' : 
                              evt.status === 'occupied' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {evt.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 capitalize">{evt.type}</td>
                          <td className="px-6 py-4 text-right">
                            {new Date(evt.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-sm">
                  No slot events recorded for this session.
                </div>
              )}
            </div>

          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default { JSX, i18n };
