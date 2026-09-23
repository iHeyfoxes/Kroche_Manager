/* Kroche Manager - frontend entrypoint
 * Carrega os módulos em ordem. Novas funcionalidades não devem ser adicionadas aqui.
 */
(function(){
  const base='assets/js/';
  ['core/common.js','features/pages.js'].forEach(src=>{
    const s=document.createElement('script');
    s.src=base+src;
    s.async=false;
    document.head.appendChild(s);
  });
})();
