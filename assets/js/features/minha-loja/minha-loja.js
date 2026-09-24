/* Minha Loja = central administrativa do catálogo. */
async function initMinhaLoja(edit=false){
  layout(); const p=await shell(edit?'Aparência da Minha Loja':'Minha Loja'); if(!p)return; const u=await user();

  if(edit){
    document.getElementById('content').innerHTML =
      '<section class="dashboard-hero modern-hero"><div><span class="eyebrow">IDENTIDADE DA LOJA</span><h2>Deixe seu catálogo com a sua cara.</h2><p>Nome, cores, banner e opções de exibição em um único lugar.</p></div><a class="btn btn-secondary" href="minha-loja.html">← Voltar para Minha Loja</a></section>'+
      '<div class="card"><form id="lojaForm" class="grid grid-2">'+
      formField('Nome do catálogo','catalogo_nome')+formField('Slogan','catalogo_slogan')+formField('WhatsApp','whatsapp')+
      formField('Cor principal','catalogo_cor','color')+formField('Cor do botão','catalogo_cor_botao','color')+formField('Cor de fundo','catalogo_cor_fundo','color')+
      '<div><label class="label">Banner da loja</label><input class="input" name="banner" type="file" accept=".png,.jpg,.jpeg,.webp"><small class="muted">Recomendado: imagem horizontal de boa resolução.</small></div>'+
      '<div class="settings-checks"><label><input type="checkbox" name="mostrar_preco" '+(p.mostrar_preco!==false?'checked':'')+'> Mostrar preço no catálogo</label><label><input type="checkbox" name="mostrar_estoque" '+(p.mostrar_estoque!==false?'checked':'')+'> Mostrar estoque</label><label><input type="checkbox" name="mostrar_tempo" '+(p.mostrar_tempo!==false?'checked':'')+'> Mostrar tempo de produção</label></div>'+
      '<div class="actions"><button class="btn btn-primary">Salvar aparência</button></div></form></div>';
    const f=document.getElementById('lojaForm');
    ['catalogo_nome','catalogo_slogan','whatsapp','catalogo_cor','catalogo_cor_botao','catalogo_cor_fundo'].forEach(k=>f.elements[k].value=p[k]||'');
    f.onsubmit=async e=>{e.preventDefault();try{
      const fd=new FormData(e.target);
      let banner=p.catalogo_banner;
      if(fd.get('banner')?.size)banner=await upload('banners',fd.get('banner'),u.id);
      const data={catalogo_nome:fd.get('catalogo_nome'),catalogo_slogan:fd.get('catalogo_slogan'),whatsapp:fd.get('whatsapp'),catalogo_cor:fd.get('catalogo_cor'),catalogo_cor_botao:fd.get('catalogo_cor_botao'),catalogo_cor_fundo:fd.get('catalogo_cor_fundo'),mostrar_preco:fd.has('mostrar_preco'),mostrar_estoque:fd.has('mostrar_estoque'),mostrar_tempo:fd.has('mostrar_tempo'),catalogo_banner:banner};
      const r=await supabaseClient.from('usuarios').update(data).eq('id',u.id);
      if(r.error)msg(r.error.message,false);
      else{
        try{sessionStorage.removeItem('kroche_profile_'+u.id)}catch{}
        _profileCache=null;
        msg('Aparência atualizada!');
        setTimeout(()=>location.href='minha-loja.html',500);
      }
    }catch(error){msg(error?.message||'Não foi possível salvar a aparência da loja.',false)}}; 
    return;
  }

  document.getElementById('content').innerHTML =
    '<section class="store-overview-hero"><div class="store-overview-copy"><span class="eyebrow">MINHA LOJA</span><h2>'+esc(p.catalogo_nome||p.nome||'Minha loja')+'</h2><p>'+esc(p.catalogo_slogan||'Configure seu catálogo público e gerencie seus produtos.')+'</p><div class="store-overview-actions"><a class="btn btn-primary" href="loja/index.html?slug='+encodeURIComponent(p.slug)+'">Abrir catálogo</a><a class="btn btn-secondary" href="minha-loja-editar.html">Editar aparência</a></div></div><div class="store-overview-preview">'+(p.catalogo_banner?'<img src="'+esc(p.catalogo_banner)+'" alt="">':'<div class="store-preview-placeholder">🧶<b>Seu catálogo</b></div>')+'</div></section>'+
    '<div class="store-tabs"><button class="store-tab active" data-tab="produtos">Produtos</button><button class="store-tab" data-tab="categorias">Categorias</button><button class="store-tab" data-tab="config">Configurações</button></div><section id="storePanel"></section>';

  const panel=document.getElementById('storePanel');
  async function renderTab(tab){
    document.querySelectorAll('.store-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='produtos'){panel.innerHTML='<div id="produtosLoja"></div>';await initProdutosLoja('produtosLoja');return}
    if(tab==='categorias'){
      panel.innerHTML='<div class="store-grid-2"><div class="card"><div class="panel-heading"><div><span class="panel-kicker">ORGANIZAÇÃO</span><h3>Nova categoria</h3></div></div><form id="categoriaForm"><label class="label">Nome da categoria</label><input class="input" name="nome" required placeholder="Ex.: Amigurumi"><button class="btn btn-primary" style="margin-top:12px">Criar categoria</button></form></div><div class="card"><div class="panel-heading"><div><span class="panel-kicker">CATÁLOGO</span><h3>Categorias cadastradas</h3></div></div><div id="categoriasLoja"></div></div></div>';
      const cat=await initCategoriasLoja('categoriasLoja');
      document.getElementById('categoriaForm').onsubmit=async e=>{e.preventDefault();const nome=String(new FormData(e.target).get('nome')).trim();const slug=nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const r=await supabaseClient.from('categorias_produtos').insert({usuario_id:u.id,nome,slug});if(r.error)msg(r.error.code==='23505'?'Essa categoria já existe.':r.error.message,false);else{msg('Categoria criada!');e.target.reset();cat.load()}};
      return;
    }
    panel.innerHTML='<div class="card"><div class="panel-heading"><div><span class="panel-kicker">CONFIGURAÇÕES</span><h3>Dados da loja</h3></div></div><div class="settings-grid"><div><b>Nome</b><span>'+esc(p.catalogo_nome||p.nome)+'</span></div><div><b>Slug público</b><span>'+esc(p.slug)+'</span></div><div><b>WhatsApp</b><span>'+esc(p.whatsapp||'Não configurado')+'</span></div><div><b>Exibição de estoque</b><span>'+ (p.mostrar_estoque!==false?'Ativa':'Oculta') +'</span></div></div></div>';
  }
  document.querySelectorAll('.store-tab').forEach(b=>b.onclick=()=>renderTab(b.dataset.tab));
  await renderTab('produtos');
}