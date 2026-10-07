import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// PWA service worker registration — production only, never inside Lovable preview iframe.
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const host = window.location.hostname;
const isPreviewHost =
  host.includes('id-preview--') ||
  host.endsWith('.lovableproject.com');
const isLocalhost = host === 'localhost' || host === '127.0.0.1';

if ('serviceWorker' in navigator) {
  if (isInIframe || isPreviewHost || isLocalhost) {
    // Clean up any previously registered SW in preview/dev contexts.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent — SW is a progressive enhancement.
      });
    });
  }
}
