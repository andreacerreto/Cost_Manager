'use strict';

/* ============================================================
 * AUTH.JS - Modalita offline.
 * ============================================================ */

function _showOfflineApp() {
  const user = document.getElementById('user-email-lbl');
  const avatar = document.getElementById('user-avatar');

  if (user) user.textContent = window.AppSettings ? AppSettings.t('offline.user') : 'Offline local';
  if (avatar) avatar.textContent = 'OL';

  if (window.AppSettings) AppSettings.apply();
  App.go('dashboard');
}

async function doLogout() {
  if (confirm('Vuoi chiudere la sessione locale? I dati salvati sul dispositivo restano disponibili.')) {
    _showOfflineApp();
  }
}

async function startApp() {
  _showOfflineApp();
}

document.addEventListener('DOMContentLoaded', startApp);
