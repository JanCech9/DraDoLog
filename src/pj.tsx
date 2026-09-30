// Entry point of the PJ (Pán jeskyně) view - a second page of the same app,
// served as /pj.html. It shares the rules engine and styles with the sheet.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/alegreya/latin-400.css';
import '@fontsource/alegreya/latin-ext-400.css';
import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya/latin-ext-500.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-ext-400.css';
import '@fontsource/alegreya-sans/latin-500.css';
import '@fontsource/alegreya-sans/latin-ext-500.css';
import './index.css';
import './pj.css';
import PjApp from './PjApp.tsx';
import { requestPersistentStorage } from './state/storage';

void requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PjApp />
  </StrictMode>,
);
