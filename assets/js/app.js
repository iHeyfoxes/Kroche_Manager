/* Kroche Manager - entrypoint do frontend.
 * Ordem: infraestrutura -> layout -> autenticação -> domínios.
 * Cada domínio é responsável apenas pela própria tela/regra.
 */
(function(){
  const base='assets/js/';
  const modules=[
    'core/supabase.js','core/utils.js','core/theme.js','core/session.js','core/layout.js','core/auth.js','core/error-handler.js',
    'features/dashboard/dashboard.js','features/vendas/vendas.js','features/compras/compras.js',
    'features/receitas/receitas.js','features/encomendas/encomendas.js','features/leads/leads.js',
    'features/relatorios/relatorios.js','features/calculadora/calculadora.js','features/ajuda/ajuda.js',
    'features/minha-loja/minha-loja.js','features/minha-loja/categorias.js','features/minha-loja/produtos.js',
    'features/estoque/estoque.js','features/perfil/perfil.js',
    'features/editar-venda/editar-venda.js','features/editar-encomenda/editar-encomenda.js'
  ];
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=base+src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.head.appendChild(s);});}
  (async()=>{try{
    for(const src of modules)await load(src);
    const page=location.pathname.split('/').pop();
    const map={
      'dashboard.html':()=>initDashboard(),'vendas.html':()=>initVendas(),'compras.html':()=>initCompras(),
      'receitas.html':()=>initReceitas(),'encomendas.html':()=>initEncomendas(),'leads.html':()=>initLeads(),
      'relatorios.html':()=>initRelatorios(),'calculadora.html':()=>initCalculadora(),'ajuda.html':()=>initAjuda(),
      'minha-loja.html':()=>initMinhaLoja(false),
      'perfil.html':()=>initPerfil(),'editar-venda.html':()=>initEditVenda(),'editar-encomenda.html':()=>initEditEncomenda(),
      'estoque.html':()=>initEstoque()
    };
    if(map[page])await map[page]();
  }catch(error){console.error(error);const content=document.getElementById('content');if(content)content.innerHTML='<div class="card error-state"><h2>Não foi possível carregar esta tela</h2><p class="muted">'+esc(error?.message||'Erro inesperado')+'</p><button class="btn btn-primary" onclick="location.reload()">Recarregar</button></div>';}}
  )();
})();