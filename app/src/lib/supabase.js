import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key exists:", !!supabaseAnonKey);

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: ${supabaseUrl}. Error: ${e.message}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
