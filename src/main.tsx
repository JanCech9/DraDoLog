import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts (latin + latin-ext, so Czech renders); work offline, no Google request.
import '@fontsource/alegreya/latin-400.css';
import '@fontsource/alegreya/latin-ext-400.css';
import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya/latin-ext-500.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-ext-400.css';
import '@fontsource/alegreya-sans/latin-500.css';
import '@fontsource/alegreya-sans/latin-ext-500.css';
import './index.css';
import App from './App.tsx';
import { requestPersistentStorage } from './state/storage';

void requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
