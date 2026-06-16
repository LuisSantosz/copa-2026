import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getDatabase, ref, set, onValue, get } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

const statusEl = () => document.getElementById('cloudStatus');
const config = window.firebaseConfig || {};
const path = window.firebaseDatabasePath || 'copa2026/app-principal';
const isConfigured = config.apiKey && !String(config.apiKey).includes('COLE_') && config.databaseURL && !String(config.databaseURL).includes('SEU_PROJETO');

function setStatus(text, type = '') {
  const el = statusEl();
  if (!el) return;
  el.textContent = text;
  el.className = `cloud-status ${type}`.trim();
}

if (!isConfigured) {
  setStatus('Nuvem não configurada — usando salvamento local', 'warn');
  window.cloudStore = null;
} else {
  try {
    const app = initializeApp(config);
    const db = getDatabase(app);
    const dataRef = ref(db, path);

    window.cloudStore = {
      async load() {
        const snap = await get(dataRef);
        return snap.exists() ? snap.val() : null;
      },
      async save(data) {
        await set(dataRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      },
      listen(callback) {
        return onValue(dataRef, (snap) => {
          if (snap.exists()) callback(snap.val());
        });
      }
    };

    setStatus('Conectado ao Firebase — salvamento em nuvem ativo', 'ok');
    window.dispatchEvent(new Event('cloud-ready'));
  } catch (error) {
    console.error(error);
    setStatus('Erro ao conectar Firebase — usando salvamento local', 'warn');
    window.cloudStore = null;
  }
}
