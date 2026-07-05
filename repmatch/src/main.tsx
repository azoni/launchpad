import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Analytics beacon — fire once per session
if (!sessionStorage.getItem('repmatch_viewed')) {
  sessionStorage.setItem('repmatch_viewed', '1');
  const key = import.meta.env.VITE_MCP_READ_KEY;
  if (key) {
    fetch('https://azoni-mcp.onrender.com/launchpad/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        app: 'repmatch',
        page: window.location.pathname,
      }),
    }).catch(() => {});
  }
}

// Portfolio traffic beacon — one visit/session to the shared leaderboard sink.
if (!sessionStorage.getItem('_av_lb')) {
  sessionStorage.setItem('_av_lb', '1');
  fetch('https://azoni.ai/.netlify/functions/log-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'repmatch' }),
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
