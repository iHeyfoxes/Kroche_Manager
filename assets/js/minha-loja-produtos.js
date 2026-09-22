(function(){
  const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let timer=0;
  function inject(){
    const content=document.getElementById('content');
    if(!content||document.getElementById('minhaLojaProdutos')) return !!content;
    const wrap=document.createElement('section'); wrap.id='minhaLojaProdutos'; wrap.className='card loja-products-panel';
    wrap.innerHTML=`<div class="panel-heading"><div><span class="panel-kicker">CATÁLOGO</span><h3>Produtos da minha loja</h3><p class="muted">Cadastre e gerencie aqui os produtos que aparecem no seu catálogo público.</p></div><a class="btn btn-secondary" href="loja/index.html" target="_blank">🛍️ Ver catálogo</a></div>
      <form id="lojaProductForm" class="grid grid-3"><div><label class="label">Nome</label><input class="input" name="nome" required></div><div><label class="label">Preço (R$)</label><input class="input" name="preco" type="number" min="0" step="0.01" required></div><div><label class="label">Quantidade</label><input class="input" name="quantidade" type="number" min="0" value="0" required></div><div style="grid-column:1/-1"><label class="label">Descrição</label><textarea class="input" name="descricao" rows="3"></textarea></div><div><label class="label">Foto</label><input class="input" name="foto" type="file" accept="image/jpeg,image/png,image/webp"></div><div><label class="label">No catálogo</label><select class="select" name="mostrar_catalogo"><option value="true">Sim</option><option value="false">Não</option></select></div><div class="actions"><button class="btn btn-primary" type="submit">＋ Cadastrar produto</button></div></form>
      <div class="table-wrap" style="margin-top:24px"><table class="table"><thead><tr><th>Foto</th><th>Produto</th><th>Preço</th><th>Estoque</th><th>Catálogo</th><th></th></tr></thead><tbody id="minhaLojaProdutosLista"><tr><td colspan="6" class="muted">Carregando produtos...</td></tr></tbody></table></div>`;
    content.appendChild(wrap);
    document.getElementById('lojaProductForm').onsubmit=save;
    load(); return true;
  }
  async function load(){
    const list=document.getElementById('minhaLojaProdutosLista'); if(!list||typeof user!=='function'||typeof supabaseClient==='undefined')return;
    const u=await user(); if(!u)return;
    const {data,error}=await supabaseClient.from('produtos').select('*').eq('usuario_id',u.id).order('created_at',{ascending:false});
    if(error){list.innerHTML='<tr><td colspan="6" class="muted">Não foi possível carregar os produtos.</td></tr>';return;}
    list.innerHTML=(data||[]).map(p=>`<tr><td>${p.foto?`<img src="${esc(p.foto)}" class="preview" style="width:48px;height:48px;margin:0">`:'—'}</td><td><b>${esc(p.nome)}</b><br><small class="muted">${esc(p.descricao||'')}</small></td><td>${money(p.preco)}</td><td>${p.quantidade??0}</td><td>${p.mostrar_catalogo?'Sim':'Não'}</td><td><button class="btn btn-danger btn-sm" data-id="${p.id}">Excluir</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Nenhum produto cadastrado ainda.</td></tr>';
    list.querySelectorAll('[data-id]').forEach(b=>b.onclick=async()=>{if(!confirm('Excluir este produto?'))return;const {error}=await supabaseClient.from('produtos').delete().eq('id',b.dataset.id).eq('usuario_id',u.id);if(error)alert('Não foi possível excluir: '+error.message);else load();});
  }
  async function save(e){
    e.preventDefault(); const form=e.currentTarget,btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Salvando...';
    try{const u=await user();if(!u)return;const fd=new FormData(form);let foto=null;const file=fd.get('foto');if(file&&file.size){foto=await upload('produtos',file,u.id)}
      const {error}=await supabaseClient.from('produtos').insert({usuario_id:u.id,nome:String(fd.get('nome')).trim(),preco:Number(fd.get('preco')||0),quantidade:Number(fd.get('quantidade')||0),descricao:String(fd.get('descricao')||'').trim(),foto,mostrar_catalogo:fd.get('mostrar_catalogo')==='true'});
      if(error)throw error;form.reset();load();if(typeof msg==='function')msg('Produto cadastrado com sucesso!');
    }catch(err){if(typeof msg==='function')msg(err.message||'Não foi possível cadastrar o produto.',false);else alert(err.message)}finally{btn.disabled=false;btn.textContent='＋ Cadastrar produto'}
  }
  const wait=setInterval(()=>{if(inject()){clearInterval(wait)}else if(++timer>30)clearInterval(wait)},300);
})();