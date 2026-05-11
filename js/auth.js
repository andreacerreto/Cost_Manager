'use strict';

/* ============================================================
 * AUTH.JS - Modalita offline
 *
 * L'app non usa piu un provider remoto: gira localmente nel
 * browser e salva i dati sul dispositivo. Le funzioni sono
 * mantenute per compatibilita con gli handler gia presenti in HTML.
 * ============================================================ */

function _showOfflineApp() {
  const login = document.getElementById('login-overlay');
  const reset = document.getElementById('reset-overlay');
  const user = document.getElementById('user-email-lbl');
  const avatar = document.getElementById('user-avatar');

  if (login) login.style.display = 'none';
  if (reset) reset.style.display = 'none';
  if (user) user.textContent = window.AppSettings ? AppSettings.t('offline.user') : 'Offline local';
  if (avatar) avatar.textContent = 'OL';

  if (window.AppSettings) AppSettings.apply();
  App.go('dashboard');
  if (window.AppSettings) AppSettings.showOnboardingIfNeeded();
}

function showLoginError(msg, color) {
  const el = document.getElementById('login-error');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || '#C62828';
  el.style.display = 'block';
}

function showResetOverlay() {
  showLoginError('La modalita offline non usa reset password remoto.');
}

async function doLogin() {
  _showOfflineApp();
}

async function doLogout() {
  if (confirm('Vuoi chiudere la sessione locale? I dati salvati sul dispositivo restano disponibili.')) {
    _showOfflineApp();
  }
}

async function doForgotPassword() {
  showLoginError('La modalita offline non richiede credenziali remote.', '#2E7D32');
}

async function doSetPassword() {
  _showOfflineApp();
}

async function startApp() {
  _showOfflineApp();
}

document.addEventListener('DOMContentLoaded', startApp);
