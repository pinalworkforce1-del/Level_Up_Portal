(() => {
  'use strict';

  const SUPABASE_URL = 'https://dnijrzotfyvmmnmueknk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc';
  const AUTH_KEY = 'sb-dnijrzotfyvmmnmueknk-auth-token';
  const CONTRACT = 'career-tree/v1';
  const MODULE_IDS = new Set(['discover-me', 'explore-careers', 'work-life-plan', 'career-quest:electrician']);

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

  function envelope(moduleId, data, updatedAt) {
    return {
      schema_version: 1,
      contract: CONTRACT,
      experience: moduleId,
      updated_at: updatedAt,
      data: data || {}
    };
  }

  function localRow(moduleId, journeyState, options) {
    const now = options.updatedAt || new Date().toISOString();
    return window.LevelUpOfflineProgress?.save(moduleId, journeyState, {
      xp: Math.max(0, Number(options.xp || 0) || 0),
      isComplete: Boolean(options.isComplete),
      completedAt: options.isComplete ? (options.completedAt || now) : null,
      updatedAt: now
    }) || {
      module_id: moduleId,
      journey_state: journeyState,
      xp: Math.max(0, Number(options.xp || 0) || 0),
      is_complete: Boolean(options.isComplete),
      completed_at: options.isComplete ? (options.completedAt || now) : null,
      updated_at: now,
      pending: true
    };
  }

  async function push(row) {
    if (!row || !MODULE_IDS.has(row.module_id) || !navigator.onLine) return { synced: false, reason: 'offline' };
    const active = session();
    if (!active) return { synced: false, reason: 'signed-out' };

    const payload = {
      user_id: active.user.id,
      module_id: row.module_id,
      journey_state: row.journey_state || {},
      xp: Math.max(0, Number(row.xp || 0) || 0),
      is_complete: Boolean(row.is_complete),
      updated_at: row.updated_at || new Date().toISOString(),
      completed_at: row.is_complete ? (row.completed_at || row.updated_at || new Date().toISOString()) : null
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/module_progress?on_conflict=user_id,module_id`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${active.access_token}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return { synced: false, reason: `http-${response.status}` };
      window.LevelUpOfflineProgress?.markSynced(row.module_id);
      return { synced: true };
    } catch (_) {
      return { synced: false, reason: 'network-error' };
    }
  }

  async function save(moduleId, data, options = {}) {
    if (!MODULE_IDS.has(moduleId)) throw new Error(`Unknown Career Tree module id: ${moduleId}`);
    const updatedAt = options.updatedAt || new Date().toISOString();
    const journeyState = envelope(moduleId, data, updatedAt);
    const row = localRow(moduleId, journeyState, { ...options, updatedAt });
    const result = await push(row);
    try {
      window.dispatchEvent(new CustomEvent('career-tree-cloud-sync', { detail: { moduleId, ...result } }));
    } catch (_) {}
    return { row, ...result };
  }

  async function load(moduleId) {
    if (!MODULE_IDS.has(moduleId) || !navigator.onLine) return null;
    const active = session();
    if (!active) return null;
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/module_progress`);
      url.searchParams.set('select', 'module_id,journey_state,xp,is_complete,updated_at,completed_at');
      url.searchParams.set('user_id', `eq.${active.user.id}`);
      url.searchParams.set('module_id', `eq.${moduleId}`);
      const response = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${active.access_token}` } });
      if (!response.ok) return null;
      const rows = await response.json();
      return Array.isArray(rows) ? (rows[0] || null) : null;
    } catch (_) {
      return null;
    }
  }

  async function flush() {
    if (!navigator.onLine || !session()) return [];
    const pending = (window.LevelUpOfflineProgress?.list?.() || []).filter(row => row?.pending && MODULE_IDS.has(row.module_id));
    const results = [];
    for (const row of pending) results.push({ moduleId: row.module_id, ...(await push(row)) });
    return results;
  }

  window.LevelUpCareerTreeSync = { contract: CONTRACT, moduleIds: [...MODULE_IDS], save, load, flush };
  window.addEventListener('online', () => { void flush(); });
  if (navigator.onLine) void flush();
})();
