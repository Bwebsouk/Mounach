import React from 'react';
import { createRoot } from 'react-dom/client';

function showError(error) {
  document.body.innerHTML = `
    <div style="font-family:Arial;padding:30px;background:#111;color:#fff;min-height:100vh">
      <h1 style="color:#ff6b6b">Erreur Bwebsouk détectée</h1>
      <pre style="white-space:pre-wrap;background:#222;padding:20px;border-radius:10px">${String(error && (error.stack || error.message || error))}</pre>
    </div>
  `;
}

window.onerror = (msg, src, line, col, err) => showError(err || msg);
window.onunhandledrejection = event => showError(event.reason);

import('./App')
  .then(module => {
    const App = module.default;
    createRoot(document.getElementById('root')).render(<App />);
  })
  .catch(showError);
