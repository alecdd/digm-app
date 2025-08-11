// lib/supa-user.ts
import { supabase } from './supabase';

export async function ensureProfile() {
  // 1) Make sure there is a session
  let { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    // Enable Anonymous provider in Supabase: Auth → Providers → Anonymous (toggle ON)
    const { data: signInData, error: signInErr } =
      await supabase.auth.signInAnonymously();
    if (signInErr) throw signInErr;

    sessionData = { session: signInData.session };
  }

  // 2) Get the user
  const { data: who } = await supabase.auth.getUser();
  const user = who?.user;
  if (!user) throw new Error('No auth user');

  // 3) Ensure a profile row exists
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (pErr) throw pErr;

  if (!profile) {
    const { error: insErr } = await supabase
      .from('profiles')
      .insert({ id: user.id, vision: '' }); // defaults for xp/level/streak come from schema
    if (insErr) throw insErr;
  }

  return user; // use user.id elsewhere
}
