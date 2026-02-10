import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const invalidUrl = !url || !/^https?:\/\//.test(url) || url.includes("YOUR_");
  const invalidAnon = !anon || anon.includes("YOUR_");
  if (invalidUrl || invalidAnon) {
    console.warn("Supabase credentials not configured. Authentication features will not work.");
    const notConfiguredError = { message: "Supabase is not configured." };
    const mockQuery = {
      select: () => mockQuery,
      order: () => mockQuery,
      limit: async () => ({ data: null, error: notConfiguredError }),
      insert: () => mockQuery,
      single: async () => ({ data: null, error: notConfiguredError }),
    };
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: notConfiguredError }),
        signInWithPassword: async () => ({ data: { user: null }, error: notConfiguredError }),
        signUp: async () => ({ data: { user: null }, error: notConfiguredError }),
        signOut: async () => ({ error: notConfiguredError }),
      },
      from: () => mockQuery,
    } as unknown as ReturnType<typeof createClient>;
  }

  supabaseInstance = createClient(url, anon);
  return supabaseInstance;
}

// For backward compatibility, create a lazy proxy
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    return getSupabase()[prop as keyof typeof supabaseInstance];
  },
});
