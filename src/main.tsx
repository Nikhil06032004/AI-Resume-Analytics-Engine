import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

let mounted = false;

function mountApp(): void {
  if (mounted) return;
  mounted = true;
  const container = document.getElementById('root');
  if (!container) return;
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Expose for enterApp() in index.html
(window as unknown as Record<string, unknown>).mountApp = mountApp;

// If the user clicked before this bundle finished loading
if ((window as unknown as Record<string, unknown>).__enterAppCalled) {
  mountApp();
}
