import { useMemo } from 'react';
import { useAccuracy } from '../../global/hook/useAnalytics';
import { I18nDomainResource } from './i18n';
import { useNavigate } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const domainName = 'accuracy-dashboard';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useAccuracy();
  const accuracyData = response?.data || [];

  const flattenedData = useMemo(() => {
    if (!accuracyData) return [];
    const flat: any[] = [];
    accuracyData.forEach((cameraData: any) => {
      if (cameraData.predictions) {
        cameraData.predictions.forEach((pred: any) => {
          flat.push({
            camera: cameraData.cameraName || `Camera ${cameraData.cameraId}`,
            method: pred.method,
            accuracy: pred.metrics?.accuracy || 0,
            precision: pred.metrics?.precision || 0,
            recall: pred.metrics?.recall || 0,
            f1Score: pred.metrics?.f1 || 0,
            confusionMatrix: {
              tp: pred.confusionMatrix?.truePositive || 0,
              fp: pred.confusionMatrix?.falsePositive || 0,
              fn: pred.confusionMatrix?.falseNegative || 0,
              tn: pred.confusionMatrix?.trueNegative || 0,
            },
          });
        });
      }
    });
    return flat;
  }, [accuracyData]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Home"
          >
            <FiHome size={20} />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div>
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-[0.1em]">
              AI Metrics
            </p>
            <h1 className="text-[18px] font-bold text-slate-800 leading-tight">
              Accuracy Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 p-6 flex flex-col items-center overflow-y-auto w-full">
        <div className="w-full max-w-5xl">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-800">
                Model Performance Metrics
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comparison between YOLO and Drone detection methods across cameras
              </p>
            </div>

            <div className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Loading accuracy data...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500 text-sm">
                  Failed to load data.
                </div>
              ) : flattenedData.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No data available.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Camera</th>
                      <th className="px-5 py-3 font-semibold">Method</th>
                      <th className="px-5 py-3 font-semibold text-right">Accuracy</th>
                      <th className="px-5 py-3 font-semibold text-right">Precision</th>
                      <th className="px-5 py-3 font-semibold text-right">Recall</th>
                      <th className="px-5 py-3 font-semibold text-right">F1-Score</th>
                      <th className="px-5 py-3 font-semibold text-center">
                        Confusion Matrix (TP, FP, FN, TN)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flattenedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-[13px] font-medium text-slate-800">
                          {row.camera}
                        </td>
                        <td className="px-5 py-3 text-[13px]">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${row.method?.toLowerCase() === 'yolo'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-purple-50 text-purple-600 border border-purple-100'
                              }`}
                          >
                            {(row.method?.toLowerCase() === 'yolo'
                              ? 'IoU Overlap'
                              : 'Pixel Diff.')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-right font-mono text-slate-700">
                          {(row.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 text-[13px] text-right font-mono text-slate-700">
                          {(row.precision * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 text-[13px] text-right font-mono text-slate-700">
                          {(row.recall * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 text-[13px] text-right font-mono text-slate-700">
                          {(row.f1Score * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center items-center gap-1">
                            <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1 rounded">
                              <div
                                className="w-8 h-8 bg-green-100 flex flex-col items-center justify-center rounded-sm"
                                title="True Positive"
                              >
                                <span className="text-[9px] text-green-700 font-bold leading-none">
                                  TP
                                </span>
                                <span className="text-[10px] text-green-900 font-mono leading-none mt-0.5">
                                  {row.confusionMatrix?.tp || 0}
                                </span>
                              </div>
                              <div
                                className="w-8 h-8 bg-red-100 flex flex-col items-center justify-center rounded-sm"
                                title="False Positive"
                              >
                                <span className="text-[9px] text-red-700 font-bold leading-none">
                                  FP
                                </span>
                                <span className="text-[10px] text-red-900 font-mono leading-none mt-0.5">
                                  {row.confusionMatrix?.fp || 0}
                                </span>
                              </div>
                              <div
                                className="w-8 h-8 bg-orange-100 flex flex-col items-center justify-center rounded-sm"
                                title="False Negative"
                              >
                                <span className="text-[9px] text-orange-700 font-bold leading-none">
                                  FN
                                </span>
                                <span className="text-[10px] text-orange-900 font-mono leading-none mt-0.5">
                                  {row.confusionMatrix?.fn || 0}
                                </span>
                              </div>
                              <div
                                className="w-8 h-8 bg-blue-100 flex flex-col items-center justify-center rounded-sm"
                                title="True Negative"
                              >
                                <span className="text-[9px] text-blue-700 font-bold leading-none">
                                  TN
                                </span>
                                <span className="text-[10px] text-blue-900 font-mono leading-none mt-0.5">
                                  {row.confusionMatrix?.tn || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default { JSX, i18n };
