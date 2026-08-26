import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import IbpWorkbench from './IbpWorkbench';
import VendorPortal from './VendorPortal';
import { DemoProvider } from './DemoContext';
import './styles.css';
import './kpi-drill.css';
import './v2.css';
import './v2-repair.css';
import './milestone-filter-polish.css';
import './milestone-filter-fix.css';
import './milestone-delayed-emphasis.css';
import './milestone-status-center.css';
import './milestone-grid-spacing.css';
import './followup-action-width.css';
import './ibp.css';
import './vendor-portal.css';
import './shared-ui.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><DemoProvider><Routes><Route path="/vendor-portal" element={<VendorPortal />} /><Route path="/control-tower" element={<App />} /><Route path="/ibp-workbench" element={<IbpWorkbench />} /><Route path="/" element={<Navigate to="/vendor-portal" replace />} /><Route path="*" element={<Navigate to="/vendor-portal" replace />} /></Routes></DemoProvider></BrowserRouter></React.StrictMode>,
);
