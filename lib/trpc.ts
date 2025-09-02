import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Prefer legacy var if present, otherwise fall back to Coach API base
  const envUrl =
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
    process.env.EXPO_PUBLIC_COACH_API_BASE ||
    "";

  if (envUrl) return envUrl.replace(/\/$/, "");

  // Safe defaults that won't crash the app
  if (__DEV__) return "http://localhost:3000";
  return "https://digm.onrender.com";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});