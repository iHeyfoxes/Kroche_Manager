// ============================================================
// CONFIGURAÇÃO DO SUPABASE
// Troque os dois valores abaixo pelos do SEU projeto:
// Painel do Supabase > Project Settings > API
// ============================================================
const SUPABASE_URL = "https://tjmemwlavrsdclvtgtcs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbWVtd2xhdnJzZGNsdnRndGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mzg4ODcsImV4cCI6MjEwNTIxNDg4N30.4BKLcM1Z8V-7qUZFKzcQhIfk_q5fjamKrP8ypKkUkxU";

// Cliente único, reaproveitado em todas as páginas (carregar sempre
// depois do <script src=".../supabase-js@2"> no HTML).
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
