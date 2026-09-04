import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

// Global safety net for unhandled errors
window.addEventListener('error', (event) => {
  console.warn('[Portal Error Caught]:', event.error || event.message);
});

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (err) {
  console.error('Fatal initialization error:', err);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #fff; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 24px; text-align: center;">
        <div style="max-width: 440px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px;">
          <h2 style="font-size: 18px; margin-bottom: 8px; color: #f59e0b;">Portal Loading Notice</h2>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">The assessment interface encountered an initialization issue. Click below to reload.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #d97706; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Reload Application</button>
        </div>
      </div>
    `;
  }
}

