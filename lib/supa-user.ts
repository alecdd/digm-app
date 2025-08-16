// lib/supa-user.ts
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type ProfileRow = { id: string; onboarded: boolean | null; vision: string | null };


export function isAnonymousUser(user?: User | null): boolean {
  if (!user) return false;
  const u: any = user;
  const identities = (u?.identities ?? []) as Array<{ provider?: string }>;
  return (
    Boolean(u?.is_anonymous) ||
    u?.app_metadata?.provider === "anonymous" ||
    identities.some(i => i?.provider === "anonymous")
  );
}

export async function ensureSession(allowAnonymous = true): Promise<User | null> {
  const { data: s } = await supabase.auth.getSession();
  if (s.session) {
    const { data: who } = await supabase.auth.getUser();
    return who.user ?? null;
  }
  if (!allowAnonymous) return null;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  const { data: who2 } = await supabase.auth.getUser();
  return who2.user ?? null;
}

export async function ensureProfile(opts?: { allowAnonymous?: boolean; defaults?: Partial<ProfileRow> }) {
  const user = await ensureSession(opts?.allowAnonymous ?? true);
  if (!user) throw new Error("No auth user/session");
  const defaults: Partial<ProfileRow> = { vision: "", onboarded: false, ...(opts?.defaults ?? {}) };

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...defaults }, { onConflict: "id" })
    .select("id,onboarded,vision")
    .single();
  if (error) throw error;
  return { user, profile: data as ProfileRow };
}

export async function getAuthState() {
  const { data: who } = await supabase.auth.getUser();
  const user = who?.user ?? null;
  if (!user) return { user: null, isAnonymous: false, onboarded: null };
  const { data: prof } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
  return { user, isAnonymous: isAnonymousUser(user), onboarded: prof?.onboarded ?? null };
}

export async function markOnboardingComplete() {
  const { data: who } = await supabase.auth.getUser();
  if (!who?.user) throw new Error("No auth user");
  const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("id", who.user.id);
  if (error) throw error;
}

export async function saveQuestionnaire<T extends Record<string, any>>(payload: T): Promise<T & { id: string }> {
  const { data: who } = await supabase.auth.getUser();
  if (!who?.user) throw new Error("No auth user");
  const { data, error } = await supabase
    .from("questionnaire")
    .upsert({ id: who.user.id, ...payload }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as T & { id: string };
}
