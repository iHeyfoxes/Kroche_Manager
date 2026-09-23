/* Compatibilidade para páginas públicas que ainda carregam este arquivo diretamente.
 * A configuração do Supabase fica em assets/js/core/supabase.js.
 * O caminho absoluto evita erro quando este loader é usado dentro de /loja/.
 */
(function(){
  const src='/assets/js/core/supabase.js';
  if (document.querySelector('script[data-kroche-supabase-core]')) return;
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset.krocheSupabaseCore='true';
  document.head.appendChild(s);
})();