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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
