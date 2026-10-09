import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tjmemwlavrsdclvtgtcs.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbWVtd2xhdnJzZGNsdnRndGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mzg4ODcsImV4cCI6MjEwNTIxNDg4N30.4BKLcM1Z8V-7qUZFKzcQhIfk_q5fjamKrP8ypKkUkxU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
