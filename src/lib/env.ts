import { z } from "zod";

// Environment variables, checked on first use so a missing key gives a clear
// message instead of a crash deep inside Supabase or Claude.

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

function parse<T extends z.ZodType>(schema: T, values: Record<string, string | undefined>): z.output<T> {
  // Empty strings from .env files count as "not set".
  const cleaned = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value === "" ? undefined : value]),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${keys}. See .env.example.`);
  }
  return result.data;
}

let publicCache: z.output<typeof publicSchema> | undefined;
let serverCache: z.output<typeof serverSchema> | undefined;

// Safe in the browser: NEXT_PUBLIC_* values are inlined at build time,
// so each one has to be written out in full here.
export function publicEnv() {
  publicCache ??= parse(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  return publicCache;
}

// Server only. The browser bundle never has these values.
export function serverEnv() {
  serverCache ??= parse(serverSchema, {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return serverCache;
}

// Without a Claude key files are stored but not read automatically.
export function claudeEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function claudeModel() {
  return process.env.CLAUDE_MODEL || "claude-opus-5-5";
}
