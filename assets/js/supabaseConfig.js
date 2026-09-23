/* Compatibilidade para páginas que ainda carregam este arquivo diretamente.
 * A configuração do Supabase agora fica em assets/js/core/supabase.js.
 */
(function(){
  const src='assets/js/core/supabase.js';
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  document.head.appendChild(s);
})();
