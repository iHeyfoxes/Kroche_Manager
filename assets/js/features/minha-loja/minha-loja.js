/* Minha Loja = central administrativa do catálogo. */
async function initMinhaLoja(edit=false){
  layout();
  const p=await shell('Minha Loja');
  if(!p)return;
  const u=await user();

  document.getElementById('content').innerHTML =
    '<section class="store-overview-hero">'+
      '<div class="store-overview-copy">'+
        '<span class="eyebrow">MINHA LOJA</span>'+
        '<h2>'+esc(p.catalogo_nome||p.nome||'Minha loja')+'</h2>'+
        '<p>'+esc(p.catalogo_slogan||'Configure seu catálogo público e gerencie seus produtos.')+'</p>'+
        '<div class="store-overview-actions">'+
          '<a class="btn btn-primary" href="loja/index.html?slug='+encodeURIComponent(p.slug)+'">Abrir catálogo</a>'+
          '<button class="btn btn-secondary" id="btnAparencia">Aparência da loja</button>'+
        '</div>'+
      '</div>'+
      '<div class="store-overview-preview">'+
        (p.catalogo_banner?'<img src="'+esc(p.catalogo_banner)+'" alt="Banner da loja">':'<div class="store-preview-placeholder">🧶<b>Seu catálogo</b></div>')+
      '</div>'+
    '</section>'+
    '<div class="store-tabs">'+
      '<button class="store-tab active" data-tab="produtos">Produtos</button>'+
      '<button class="store-tab" data-tab="categorias">Categorias</button>'+
      '<button class="store-tab" data-tab="aparencia">Aparência</button>'+
      '<button class="store-tab" data-tab="config">Configurações</button>'+
    '</div>'+
    '<section id="storePanel"></section>';

  const panel=document.getElementById('storePanel');

  async function salvarAparencia(form){
    const fd=new FormData(form);
    const bannerAtual=p.catalogo_banner||'';
    let banner=bannerAtual;
    const arquivo=fd.get('banner');
    if(arquivo?.size)banner=await upload('banners',arquivo,u.id);

    const data={
      catalogo_nome:String(fd.get('catalogo_nome')||'').trim(),
      catalogo_slogan:String(fd.get('catalogo_slogan')||'').trim(),
      whatsapp:String(fd.get('whatsapp')||'').trim(),
      catalogo_cor:fd.get('catalogo_cor')||'#5f4537',
      catalogo_cor_botao:fd.get('catalogo_cor_botao')||'#c28f62',
      catalogo_cor_fundo:fd.get('catalogo_cor_fundo')||'#fbfaf8',
      mostrar_preco:fd.has('mostrar_preco'),
      mostrar_estoque:fd.has('mostrar_estoque'),
      mostrar_tempo:fd.has('mostrar_tempo'),
      catalogo_banner:banner
    };

    if(!data.catalogo_nome)throw new Error('Informe o nome do catálogo.');
    if(!data.whatsapp)throw new Error('Informe o WhatsApp da loja.');

    const r=await supabaseClient.from('usuarios').update(data).eq('id',u.id);
    if(r.error)throw r.error;

    Object.assign(p,data);
    try{sessionStorage.removeItem('kroche_profile_'+u.id)}catch{}
    _profileCache=null;
    msg('Aparência da loja atualizada!');
    renderAparencia();
  }

  function renderAparencia(){
    panel.innerHTML=
      '<div class="appearance-layout">'+
        '<div class="card appearance-card">'+
          '<div class="panel-heading"><div><span class="panel-kicker">IDENTIDADE</span><h3>Aparência do catálogo</h3><p class="muted">Tudo em um único lugar. As alterações aparecem no catálogo público.</p></div></div>'+
          '<form id="lojaForm" class="appearance-form">'+
            '<div class="appearance-fields appearance-fields-2">'+
              formField('Nome do catálogo','catalogo_nome')+
              formField('Slogan','catalogo_slogan')+
            '</div>'+
            '<div class="appearance-fields appearance-fields-2">'+
              formField('WhatsApp para pedidos','whatsapp','tel','placeholder="5562999999999"')+
              '<div><label class="label">Banner da loja</label><input class="input" name="banner" type="file" accept=".png,.jpg,.jpeg,.webp"><small class="muted">Use uma imagem horizontal, de preferência 1600×500 ou maior.</small></div>'+
            '</div>'+
            '<div class="appearance-color-grid">'+
              '<div class="appearance-color-field"><label class="label">Cor principal</label><div class="appearance-color-control"><input name="catalogo_cor" type="color" value="'+esc(p.catalogo_cor||'#5f4537')+'"><span data-color-value="catalogo_cor">'+esc(p.catalogo_cor||'#5f4537')+'</span></div></div>'+
              '<div class="appearance-color-field"><label class="label">Cor dos botões</label><div class="appearance-color-control"><input name="catalogo_cor_botao" type="color" value="'+esc(p.catalogo_cor_botao||'#c28f62')+'"><span data-color-value="catalogo_cor_botao">'+esc(p.catalogo_cor_botao||'#c28f62')+'</span></div></div>'+
              '<div class="appearance-color-field"><label class="label">Cor de fundo</label><div class="appearance-color-control"><input name="catalogo_cor_fundo" type="color" value="'+esc(p.catalogo_cor_fundo||'#fbfaf8')+'"><span data-color-value="catalogo_cor_fundo">'+esc(p.catalogo_cor_fundo||'#fbfaf8')+'</span></div></div>'+
            '</div>'+
            '<div class="appearance-options">'+
              '<label><input type="checkbox" name="mostrar_preco" '+(p.mostrar_preco!==false?'checked':'')+'> Mostrar preço</label>'+
              '<label><input type="checkbox" name="mostrar_estoque" '+(p.mostrar_estoque!==false?'checked':'')+'> Mostrar disponibilidade</label>'+
              '<label><input type="checkbox" name="mostrar_tempo" '+(p.mostrar_tempo!==false?'checked':'')+'> Mostrar tempo de produção</label>'+
            '</div>'+
            '<div class="actions appearance-actions"><button class="btn btn-primary" type="submit">Salvar alterações</button><button class="btn btn-secondary" type="button" id="btnAbrirCatalogo">Ver catálogo</button></div>'+
          '</form>'+
        '</div>'+
        '<div class="appearance-preview">'+
          '<div class="appearance-preview-top"><span>PRÉVIA</span><b>Seu catálogo</b></div>'+
          '<div class="appearance-preview-window" id="appearancePreview">'+
            '<div class="appearance-preview-brand" data-preview="primary"><span class="appearance-preview-logo">🧶</span><div><b data-preview-name>'+esc(p.catalogo_nome||p.nome||'Minha loja')+'</b><small>Catálogo online</small></div></div>'+
            '<div class="appearance-preview-banner" data-preview="background">'+(p.catalogo_banner?'<img src="'+esc(p.catalogo_banner)+'" alt="">':'<span>🧶</span>')+'</div>'+
            '<div class="appearance-preview-body" data-preview="background"><span data-preview-slogan>'+esc(p.catalogo_slogan||'Peças feitas à mão com carinho.')+'</span><button data-preview="button" type="button">Adicionar ao carrinho</button></div>'+
          '</div>'+
        '</div>'+
      '</div>';

    const form=document.getElementById('lojaForm');
    ['catalogo_nome','catalogo_slogan','whatsapp'].forEach(k=>form.elements[k].value=p[k]||'');

    form.querySelectorAll('input[type=color]').forEach(input=>{
      input.oninput=()=>{
        const value=input.value;
        const label=form.querySelector('[data-color-value="'+input.name+'"]');
        if(label)label.textContent=value;
        const preview=document.getElementById('appearancePreview');
        if(!preview)return;
        if(input.name==='catalogo_cor'){
          preview.querySelectorAll('[data-preview="primary"]').forEach(e=>e.style.background=value);
        }
        if(input.name==='catalogo_cor_botao'){
          preview.querySelectorAll('[data-preview="button"]').forEach(e=>e.style.background=value);
        }
        if(input.name==='catalogo_cor_fundo'){
          preview.querySelectorAll('[data-preview="background"]').forEach(e=>e.style.background=value);
        }
      };
    });

    form.elements.catalogo_nome.oninput=e=>{const el=panel.querySelector('[data-preview-name]');if(el)el.textContent=e.target.value||'Minha loja'};
    form.elements.catalogo_slogan.oninput=e=>{const el=panel.querySelector('[data-preview-slogan]');if(el)el.textContent=e.target.value||'Peças feitas à mão com carinho.'};

    const preview=document.getElementById('appearancePreview');
    preview.querySelectorAll('[data-preview="primary"]').forEach(e=>e.style.background=p.catalogo_cor||'#5f4537');
    preview.querySelectorAll('[data-preview="button"]').forEach(e=>e.style.background=p.catalogo_cor_botao||'#c28f62');
    preview.querySelectorAll('[data-preview="background"]').forEach(e=>e.style.background=p.catalogo_cor_fundo||'#fbfaf8');

    form.onsubmit=async e=>{
      e.preventDefault();
      const button=form.querySelector('button[type=submit]');
      button.disabled=true;button.textContent='Salvando...';
      try{await salvarAparencia(form)}
      catch(error){msg(error?.message||'Não foi possível salvar as alterações.',false)}
      finally{button.disabled=false;button.textContent='Salvar alterações'}
    };

    document.getElementById('btnAbrirCatalogo').onclick=()=>window.open('loja/index.html?slug='+encodeURIComponent(p.slug),'_blank');
  }

  async function renderTab(tab){
    document.querySelectorAll('.store-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));

    if(tab==='produtos'){
      panel.innerHTML='<div id="produtosLoja"></div>';
      await initProdutosLoja('produtosLoja');
      return;
    }

    if(tab==='categorias'){
      panel.innerHTML='<div class="store-grid-2"><div class="card"><div class="panel-heading"><div><span class="panel-kicker">ORGANIZAÇÃO</span><h3>Nova categoria</h3></div></div><form id="categoriaForm"><label class="label">Nome da categoria</label><input class="input" name="nome" required placeholder="Ex.: Amigurumi"><button class="btn btn-primary" style="margin-top:12px">Criar categoria</button></form></div><div class="card"><div class="panel-heading"><div><span class="panel-kicker">CATÁLOGO</span><h3>Categorias cadastradas</h3></div></div><div id="categoriasLoja"></div></div></div>';
      const cat=await initCategoriasLoja('categoriasLoja');
      document.getElementById('categoriaForm').onsubmit=async e=>{
        e.preventDefault();
        const nome=String(new FormData(e.target).get('nome')).trim();
        const slug=nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        const r=await supabaseClient.from('categorias_produtos').insert({usuario_id:u.id,nome,slug});
        if(r.error)msg(r.error.code==='23505'?'Essa categoria já existe.':r.error.message,false);
        else{msg('Categoria criada!');e.target.reset();cat.load()}
      };
      return;
    }

    if(tab==='aparencia'){
      renderAparencia();
      return;
    }

    panel.innerHTML='<div class="card"><div class="panel-heading"><div><span class="panel-kicker">CONFIGURAÇÕES</span><h3>Dados da loja</h3></div></div><div class="settings-grid"><div><b>Nome</b><span>'+esc(p.catalogo_nome||p.nome)+'</span></div><div><b>Slug público</b><span>'+esc(p.slug)+'</span></div><div><b>WhatsApp</b><span>'+esc(p.whatsapp||'Não configurado')+'</span></div></div><div class="actions"><button class="btn btn-secondary" id="btnConfigAparencia">Abrir aparência</button></div></div>';
    document.getElementById('btnConfigAparencia').onclick=()=>renderTab('aparencia');
  }

  document.querySelectorAll('.store-tab').forEach(b=>b.onclick=()=>renderTab(b.dataset.tab));
  document.getElementById('btnAparencia').onclick=()=>renderTab('aparencia');
  await renderTab('produtos');
}
