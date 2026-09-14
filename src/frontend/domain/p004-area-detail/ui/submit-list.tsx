import { useNavigate } from 'react-router-dom';
import { useAreaSessionList } from '../../../global/hook/submit/useAreaSession';

const SubmitList = (props: { areaId: number }) => {
  const { areaId } = props;
  const navigate = useNavigate();

  const { data, isLoading, error } = useAreaSessionList(areaId);
  const sessions = data?.data || [];

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-semibold text-gray-900">Submit History</h2>
        <button
          onClick={() => {
            navigate(`/area/${areaId}/input`);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-sm hover:bg-gray-800 transition-colors"
        >
          + New Submit
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">Loading submissions...</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-4 text-center">Failed to load submissions.</div>
      ) : sessions.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-sm">
          No submissions found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Date</th>
                {/* <th scope="col" className="px-6 py-3">Cameras</th> */}
                <th scope="col" className="px-6 py-3">Slots</th>
                <th scope="col" className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">#{session.id}</td>
                  <td className="px-6 py-4">{new Date(session.created_at).toLocaleString()}</td>
                  {/* <td className="px-6 py-4">{session.cameraSessions?.length || 0}</td> */}
                  <td className="px-6 py-4">{session.slotEvents?.length || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/area/${areaId}/session/${session.id}`)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmitList;
