import React, { useState, useMemo } from 'react';
import { FiFilter } from 'react-icons/fi';
import { useRawData, RawDataResponse } from '../../global/hook/useAnalytics';
import { apiFetch } from '../../../core/api';

const I18N = {
  th: {
    raw_data: {
      title: 'ข้อมูลดิบ',
      export_csv: 'ส่งออก CSV',
      timestamp: 'เวลา',
      camera: 'กล้อง',
      slot: 'ช่องจอด',
      status: 'สถานะ',
      confidence: 'ความมั่นใจ',
      page: 'หน้า',
      of: 'จาก',
      prev: 'ก่อนหน้า',
      next: 'ถัดไป',
    },
  },
  en: {
    raw_data: {
      title: 'Raw Data Dashboard',
      export_csv: 'Export to CSV',
      timestamp: 'Time',
      submit_id: 'Submit Section',
      slot: 'Slot',
      manual: 'Manual Status',
      drone: 'Drone Status',
      yolo: 'YOLO Status',
      page: 'Page',
      of: 'of',
      prev: 'Prev',
      next: 'Next',
    },
  },
};

const i18n = {
  en: I18N.en,
  th: I18N.th,
};

const P012RawDataDashboard = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterText, setFilterText] = useState('');
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [colSearch, setColSearch] = useState<Record<string, string>>({});

  const { data: response, isLoading } = useRawData({ page, pageSize: pageSize || 10 });
  const rawData = response?.data?.data || [];
  const meta = (response?.data as any)?.meta;
  const total = meta?.total || 0;
  const totalPages = Math.ceil(total / (pageSize || 10)) || 1;

  const uniqueValues = useMemo(() => {
    const values: Record<string, string[]> = {
      camera: [],
      session_id: [],
      slot: [],
      manual: [],
      drone: [],
      yolo: []
    };
    rawData.forEach((item: any) => {
      const cam = item.camera_name || '-';
      const sess = String(item.session_id);
      const sl = item.slot_name || String(item.slot_id);
      const man = item.manual || '-';
      const dr = item.drone || '-';
      const yl = item.yolo || '-';
      if (!values.camera.includes(cam)) values.camera.push(cam);
      if (!values.session_id.includes(sess)) values.session_id.push(sess);
      if (!values.slot.includes(sl)) values.slot.push(sl);
      if (!values.manual.includes(man)) values.manual.push(man);
      if (!values.drone.includes(dr)) values.drone.push(dr);
      if (!values.yolo.includes(yl)) values.yolo.push(yl);
    });
    Object.keys(values).forEach(k => values[k].sort());
    return values;
  }, [rawData]);

  const toggleFilterVal = (col: string, val: string) => {
    setColumnFilters(prev => {
      const current = prev[col] || [];
      let next: string[];
      if (current.includes(val)) {
        next = current.filter(v => v !== val);
      } else {
        next = [...current, val];
      }
      return {
        ...prev,
        [col]: next
      };
    });
    setPage(1);
  };

  const updateColSearch = (col: string, query: string) => {
    setColSearch(prev => ({ ...prev, [col]: query }));
  };

  const filteredData = useMemo(() => {
    return rawData.filter((item: any) => {
      if (filterText.trim()) {
        const search = filterText.toLowerCase();
        const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString().toLowerCase() : '';
        const matchesSearch = (
          (item.camera_name || '').toLowerCase().includes(search) ||
          String(item.session_id).toLowerCase().includes(search) ||
          timeStr.includes(search) ||
          (item.slot_name || String(item.slot_id)).toLowerCase().includes(search) ||
          (item.manual || '').toLowerCase().includes(search) ||
          (item.drone || '').toLowerCase().includes(search) ||
          (item.yolo || '').toLowerCase().includes(search)
        );
        if (!matchesSearch) return false;
      }

      for (const [col, selectedVals] of Object.entries(columnFilters)) {
        if (!selectedVals || selectedVals.length === 0) continue;
        
        let itemVal = '';
        if (col === 'camera') itemVal = item.camera_name || '-';
        else if (col === 'session_id') itemVal = String(item.session_id);
        else if (col === 'slot') itemVal = item.slot_name || String(item.slot_id);
        else if (col === 'manual') itemVal = item.manual || '-';
        else if (col === 'drone') itemVal = item.drone || '-';
        else if (col === 'yolo') itemVal = item.yolo || '-';

        if (!selectedVals.includes(itemVal)) {
          return false;
        }
      }

      return true;
    });
  }, [rawData, filterText, columnFilters]);

  const [isExporting, setIsExporting] = useState(false);

  const renderHeader = (label: string, col: string) => {
    const isFiltered = (columnFilters[col] || []).length > 0;
    const items = uniqueValues[col] || [];
    const searchVal = colSearch[col] || '';
    const displayedItems = items.filter(val =>
      val.toLowerCase().includes(searchVal.toLowerCase())
    );

    return (
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider relative">
        <div className="flex items-center justify-between">
          <span className="select-none">{label}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === col ? null : col);
            }}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ml-1 ${
              isFiltered ? 'text-blue-600 bg-blue-50 border border-blue-200 font-bold' : 'text-gray-400'
            }`}
            title={`Filter by ${label}`}
          >
            <FiFilter size={12} />
          </button>
        </div>

        {activeDropdown === col && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-transparent cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(null);
              }}
            />
            <div 
              className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 text-slate-800 normal-case font-normal"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchVal}
                onChange={(e) => updateColSearch(col, e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div className="flex justify-between text-[11px] mb-2 pb-1.5 border-b border-gray-100">
              <button
                onClick={() => {
                  setColumnFilters(prev => ({ ...prev, [col]: [] }));
                  setPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setColumnFilters(prev => ({ ...prev, [col]: [...items] }));
                  setPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {displayedItems.length === 0 ? (
                <div className="text-[11px] text-gray-400 text-center py-2">No matches</div>
              ) : (
                displayedItems.map((val) => {
                  const isChecked = columnFilters[col]?.includes(val) ?? false;
                  return (
                    <label key={val} className="flex items-center gap-2 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFilterVal(col, val)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="truncate flex-1" title={val}>{val}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          </>
        )}
      </th>
    );
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const limit = total > 0 ? total : 1;
      const res = await apiFetch<RawDataResponse>(`/analytics/raw-data?page=1&limit=${limit}`, { isPublic: true });
      const allData = res.data?.data || [];
      
      const headers = ['Camera', 'Submit ID', 'Time', 'Slot', 'Manual Status', 'Drone Status', 'YOLO Status'];
      let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
      
      allData.forEach((row: any) => {
        const rowData = [
          row.camera_name || 'N/A',
          row.session_id,
          row.timestamp ? new Date(row.timestamp).toISOString() : 'N/A',
          row.slot_name || row.slot_id,
          row.manual || 'N/A',
          row.drone || 'N/A',
          row.yolo || 'N/A'
        ];
        csvContent += rowData.join(',') + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `raw_data_all.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Raw Data Dashboard</h1>
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter value:</label>
          <input
            type="text"
            placeholder="Search camera, slot, status..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-80 px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Rows to display:</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
              setPageSize(val as any);
              setPage(1);
            }}
            onBlur={() => {
              if (pageSize === '' || pageSize < 1) {
                setPageSize(10);
              }
            }}
            className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-lg shadow relative">
        {isLoading && rawData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading data...</div>
          </div>
        ) : (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-30 flex items-center justify-center">
                <div className="text-slate-500 text-sm font-medium">Updating...</div>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {renderHeader('Camera', 'camera')}
                {renderHeader('Submit Section', 'session_id')}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                {renderHeader('Slot', 'slot')}
                {renderHeader('Manual', 'manual')}
                {renderHeader('Drone', 'drone')}
                {renderHeader('YOLO', 'yolo')}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No data available</td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={`${item.session_id}-${item.slot_id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.camera_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.session_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.slot_name || item.slot_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.manual === 'occupied' ? 'bg-red-100 text-red-800' : item.manual === 'empty' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.manual || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.drone === 'occupied' ? 'bg-red-100 text-red-800' : item.drone === 'empty' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.drone || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.yolo === 'occupied' ? 'bg-red-100 text-red-800' : item.yolo === 'empty' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.yolo || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Page {page} of {totalPages} (Total: {total})
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading || totalPages === 0}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default { JSX: P012RawDataDashboard, i18n };
