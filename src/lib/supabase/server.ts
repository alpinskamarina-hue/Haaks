import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv, serverEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component: the middleware refreshes the session instead.
          }
        },
      },
    },
  );
}

// Service account for the public pages (/p, /q, /f): no worker is signed in there.
// It signs in once per server instance; its database rights are limited to what
// those pages need (supabase/migrations/20261019000001_server_account.sql).
let serverClient: Promise<SupabaseClient> | undefined;

export function createServerAccountClient() {
  serverClient ??= (async () => {
    const env = serverEnv();
    const client = createPlainClient(
      publicEnv().NEXT_PUBLIC_SUPABASE_URL,
      publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: true } },
    );
    const { error } = await client.auth.signInWithPassword({
      email: env.HAAKS_SERVER_EMAIL,
      password: env.HAAKS_SERVER_PASSWORD,
    });
    if (error) throw new Error(`Service account sign-in failed: ${error.message}`);
    return client;
  })().catch((error) => {
    serverClient = undefined;
    throw error;
  });
  return serverClient;
}
