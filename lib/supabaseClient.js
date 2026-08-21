import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fails loudly at build/runtime instead of silently breaking login —
  // much easier to debug than a mysterious blank auth modal.
  console.error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (and in your " +
    "Vercel project's Environment Variables for production)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
