// lib/nav.ts
import type { Href } from "expo-router";

export function goLogin(
  router: any,
  reason: string,
  redirect: Href = "/onboarding/finish" as Href
) {
  console.log(`[nav] -> /auth/login (reason: ${reason}, redirect: ${redirect})`);
  router.replace({ pathname: "/auth/login", params: { redirect } });
}
