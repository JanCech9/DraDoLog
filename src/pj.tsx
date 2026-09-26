// Entry point of the PJ (Pán jeskyně) view - a second page of the same app,
// served as /pj.html. It shares the rules engine and styles with the sheet.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './pj.css';
import PjApp from './PjApp.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PjApp />
  </StrictMode>,
);
