/* Compatibilidade para páginas públicas de autenticação.
 * A implementação agora fica em assets/js/core/auth.js.
 * Este arquivo será removido após a migração das páginas públicas.
 */
(function(){
  const src='assets/js/core/auth.js';
  const s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);
})();
