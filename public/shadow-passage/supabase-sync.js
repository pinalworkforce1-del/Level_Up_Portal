(() => {
  const SUPABASE_URL = 'https://dnijrzotfyvmmnmueknk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc';
  const MODULE_ID = 'shadow-passage';
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function session(){
    if(!client) return null;
    const { data, error } = await client.auth.getSession();
    if(error) throw error;
    return data.session;
  }

  window.ShadowPassageCloud = {
    async load(){
      const s = await session();
      if(!s) return { signedIn:false, state:null };
      const { data, error } = await client
        .from('module_progress')
        .select('journey_state,xp,is_complete,updated_at')
        .eq('user_id', s.user.id)
        .eq('module_id', MODULE_ID)
        .maybeSingle();
      if(error) throw error;
      return { signedIn:true, state:data?.journey_state || null, row:data || null };
    },

    async save(state, complete=false){
      const s = await session();
      if(!s) return { signedIn:false };
      const now = new Date().toISOString();
      const payload = {
        user_id: s.user.id,
        module_id: MODULE_ID,
        journey_state: state,
        xp: Number(state?.xp || 0),
        is_complete: Boolean(complete || state?.finished),
        updated_at: now,
        completed_at: (complete || state?.finished) ? now : null
      };
      const { error } = await client.from('module_progress').upsert(payload, { onConflict:'user_id,module_id' });
      if(error) throw error;
      return { signedIn:true };
    }
  };
})();
