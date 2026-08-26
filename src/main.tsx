import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import './styles.css';
import './kpi-drill.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><Routes><Route path="/control-tower" element={<App />} /><Route path="/" element={<Navigate to="/control-tower" replace />} /><Route path="*" element={<Navigate to="/control-tower" replace />} /></Routes></BrowserRouter></React.StrictMode>,
);
