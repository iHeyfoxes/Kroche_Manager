/* Kroche Manager - entrypoint do frontend.
 * Carrega o núcleo, regras compartilhadas e módulos de tela em ordem.
 */
(function(){
  const base='assets/js/';
  const modules=[
    'core/common.js','features/pages.js',
    'features/dashboard/dashboard.js','features/produtos/produtos.js','features/vendas/vendas.js',
    'features/compras/compras.js','features/receitas/receitas.js','features/encomendas/encomendas.js',
    'features/leads/leads.js','features/relatorios/relatorios.js','features/calculadora/calculadora.js',
    'features/ajuda/ajuda.js','features/minha-loja/minha-loja.js','features/perfil/perfil.js',
    'features/editar-venda/editar-venda.js','features/editar-encomenda/editar-encomenda.js',
    'features/clientes/clientes.js','features/materiais/materiais.js'
  ];
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=base+src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.head.appendChild(s);});}
  (async()=>{try{
    for(const src of modules)await load(src);
    const page=location.pathname.split('/').pop();
    const map={
      'dashboard.html':()=>initDashboard(),'produtos.html':()=>initProdutos(),'vendas.html':()=>initVendas(),
      'compras.html':()=>initCompras(),'receitas.html':()=>initReceitas(),'encomendas.html':()=>initEncomendas(),
      'leads.html':()=>initLeads(),'relatorios.html':()=>initRelatorios(),'calculadora.html':()=>initCalculadora(),
      'ajuda.html':()=>initAjuda(),'minha-loja.html':()=>initMinhaLoja(false),'minha-loja-editar.html':()=>initMinhaLoja(true),
      'perfil.html':()=>initPerfil(),'editar-venda.html':()=>initEditVenda(),'editar-encomenda.html':()=>initEditEncomenda(),
      'clientes.html':()=>initClientes(),'materiais.html':()=>initMateriais()
    };
    if(map[page])await map[page]();
  }catch(error){console.error(error);const content=document.getElementById('content');if(content)content.innerHTML='<div class="card error-state"><h2>Não foi possível carregar esta tela</h2><p class="muted">'+esc(error?.message||'Erro inesperado')+'</p><button class="btn btn-primary" onclick="location.reload()">Recarregar</button></div>';}}
  )();
})();
