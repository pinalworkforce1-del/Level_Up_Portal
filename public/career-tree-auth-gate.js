(() => {
  'use strict';

  const SUPABASE_URL = 'https://dnijrzotfyvmmnmueknk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc';
  const AUTH_KEY = 'sb-dnijrzotfyvmmnmueknk-auth-token';
  const RETURN_KEY = 'level-up-career-tree-auth-return-v1';
  const scriptUrl = document.currentScript?.src || '';
  const portalRoot = scriptUrl ? new URL('./', scriptUrl).href : new URL('../../', window.location.href).href;

  document.documentElement.setAttribute('data-career-tree-auth', 'checking');
  const style = document.createElement('style');
  style.textContent = 'html[data-career-tree-auth="checking"] body{visibility:hidden!important}';
  document.head.appendChild(style);

  function session() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const current = parsed?.currentSession || parsed?.session || parsed;
      if (!current?.access_token || !current?.user?.id) return null;
      return current;
    } catch (_) {
      return null;
    }
  }

  function authorize(active, verification) {
    document.documentElement.setAttribute('data-career-tree-auth', 'ready');
    style.remove();
    try {
      window.dispatchEvent(new CustomEvent('career-tree-auth-ready', {
        detail: { userId: active.user.id, verification }
      }));
    } catch (_) {}
    return active;
  }

  function redirectToLogin(reason) {
    try {
      sessionStorage.setItem(RETURN_KEY, window.location.href);
    } catch (_) {}
    const destination = new URL(portalRoot);
    destination.searchParams.set('careerTree', 'login-required');
    if (reason) destination.searchParams.set('reason', reason);
    window.location.replace(destination.href);
  }

  async function verify() {
    const active = session();
    if (!active) {
      redirectToLogin('signed-out');
      return null;
    }

    if (!navigator.onLine) return authorize(active, 'cached-offline');

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${active.access_token}`
        }
      });

      if (response.ok) return authorize(active, 'verified-online');
      if (response.status === 401 || response.status === 403) {
        redirectToLogin('session-expired');
        return null;
      }

      // Do not strand a previously authenticated participant because Supabase
      // is temporarily unavailable. RLS still protects all cloud writes.
      return authorize(active, 'cached-service-fallback');
    } catch (_) {
      // navigator.onLine can remain true during a network interruption.
      // A cached authenticated session preserves the intended offline-first UX.
      return authorize(active, 'cached-network-fallback');
    }
  }

  const ready = verify();
  window.LevelUpCareerTreeAuth = { ready, session };
})();
