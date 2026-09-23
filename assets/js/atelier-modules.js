/* Compatibilidade: os módulos de Clientes e Materiais foram separados. */
(function(){
  const base='assets/js/features/';
  const page=location.pathname.split('/').pop();
  const modules={
    'clientes.html':'clientes/clientes.js',
    'materiais.html':'materiais/materiais.js'
  };
  const file=modules[page];
  if(!file)return;
  const s=document.createElement('script');
  s.src=base+file;
  s.async=false;
  document.head.appendChild(s);
})();
