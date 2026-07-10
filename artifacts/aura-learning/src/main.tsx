import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// ─── Service Worker registration ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] registered, scope:', reg.scope);
        // Check for updates periodically
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch(err => console.warn('[SW] registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
