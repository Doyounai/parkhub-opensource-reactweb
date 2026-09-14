import './index.scss';

import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';

import P002_Login from '../../frontend/domain/p002-login';
import P003_AreaList from '../../frontend/domain/p003-area-list';
import P004_AreaDetail from '../../frontend/domain/p004-area-detail';
import p005AreaEditor from '../../frontend/domain/p005-area-editor';
import P006AreaCamera from '../../frontend/domain/p006-area-camera';
import P007AreaSessionInput from '../../frontend/domain/p007-area-session-input';
import P008AreaSessionDetail from '../../frontend/domain/p008-area-session-detail';
import P009AreaAnalytics from '../../frontend/domain/p009-area-analytics';
import P010MainDashboard from '../../frontend/domain/p010-main-dashboard';
import P011AccuracyDashboard from '../../frontend/domain/p011-accuracy-dashboard';
import P012RawDataDashboard from '../../frontend/domain/p012-raw-data-dashboard';

const i18nList: I18n[] = [
  P002_Login.i18n,
  P003_AreaList.i18n,
  P004_AreaDetail.i18n,
  p005AreaEditor.i18n,
  P006AreaCamera.i18n,
  P007AreaSessionInput.i18n,
  P008AreaSessionDetail.i18n,
  P009AreaAnalytics.i18n,
  // P010MainDashboard.i18n,
  // P011AccuracyDashboard.i18n,
  // P012RawDataDashboard.i18n,
];

const jsx = () => {
  return (
    <div className="w-full h-full overflow-hidden relative">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<P002_Login.JSX />} index />
          <Route path="/area" element={<Outlet />}>
            <Route path="" element={<P003_AreaList.JSX />} index />
            <Route path="/area/:id" element={<Outlet />}>
              <Route path="" element={<P004_AreaDetail.JSX />} index />
              <Route path="editor" element={<p005AreaEditor.JSX />} />
              <Route path="camera/:cameraid" element={<P006AreaCamera.JSX />} />
              <Route path="input" element={<P007AreaSessionInput.JSX />} />
              <Route path="session/:sessionId" element={<P008AreaSessionDetail.JSX />} />
              <Route path="analytics" element={<P009AreaAnalytics.JSX />} />
              <Route path="dashboard" element={<P010MainDashboard.JSX />} />
            </Route>
          </Route>
          <Route path="/accuracy-dashboard" element={<P011AccuracyDashboard.JSX />} />
          <Route path="/raw-data" element={<P012RawDataDashboard.JSX />} />

          {/* Default page */}
          <Route path="*" element={<div className="">URL Not Found</div>}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default { jsx, i18nList };
