/* Produtos da Minha Loja. Não existe mais uma tela de Produtos separada. */
async function initProdutosLoja(container){
  const u=await user();if(!u)return;
  const root=document.getElementById(container);if(!root)return;
  let editId=null;
  async function categorias(){
    const {data}=await supabaseClient.from('categorias_produtos').select('id,nome').eq('usuario_id',u.id).eq('ativo',true).order('nome');
    return data||[];
  }
  async function load(){
    const [cats,prodRes]=await Promise.all([categorias(),supabaseClient.from('produtos').select('*').eq('usuario_id',u.id).order('nome')]);
    if(prodRes.error){msg(prodRes.error.message,false);return}
    root.innerHTML=`<div class="store-form-card"><div class="panel-heading"><div><span class="panel-kicker">CATÁLOGO</span><h3>${editId?'Editar produto':'Novo produto'}</h3></div><span class="pill">Minha Loja</span></div>
      <form id="produtoLojaForm" class="grid grid-3">
        <input type="hidden" name="id" value="${editId||''}">
        ${formField('Nome','nome','text','required')}
        ${formField('Preço (R$)','preco','number','step="0.01" min="0" required')}
        ${formField('Quantidade','quantidade','number','min="0" required')}
        ${formField('Tempo de produção (dias)','tempo_producao','number','min="0"')}
        <div><label class="label">Categoria</label><select class="select" name="categoria_id"><option value="">Sem categoria</option>${cats.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></div>
        <div><label class="label">Foto do produto</label><input class="input" name="foto" type="file" accept="image/png,image/jpeg,image/webp"></div>
        <div><label class="label">Catálogo</label><select class="select" name="mostrar_catalogo"><option value="true">Visível</option><option value="false">Oculto</option></select></div>
        <div style="grid-column:1/-1">${formField('Descrição','descricao','text')}</div>
        <div class="actions"><button class="btn btn-primary" type="submit">${editId?'Salvar alterações':'Cadastrar produto'}</button>${editId?'<button class="btn btn-secondary" type="button" id="cancelEdit">Cancelar</button>':''}</div>
      </form></div>
      <div class="store-list-card"><div class="panel-heading"><div><span class="panel-kicker">PRODUTOS</span><h3>Produtos cadastrados</h3></div><span class="pill">${(prodRes.data||[]).length} itens</span></div>
      <div class="store-product-list">${(prodRes.data||[]).map(p=>{const c=cats.find(x=>x.id===p.categoria_id);return `<div class="store-product-row"><div class="store-product-thumb">${p.foto?'<img src="'+esc(p.foto)+'" alt="">':'🧶'}</div><div class="store-product-main"><b>${esc(p.nome)}</b><small>${esc(c?.nome||p.categoria||'Sem categoria')} · ${money(p.preco)}</small></div><span class="pill ${p.mostrar_catalogo?'success':'muted'}">${p.mostrar_catalogo?'No catálogo':'Oculto'}</span><span class="stock-number">${p.quantidade} un.</span><div class="row-actions"><button class="btn btn-secondary btn-sm" data-edit="${p.id}">Editar</button><button class="btn btn-danger btn-sm" data-delete="${p.id}">Excluir</button></div></div>`}).join('')||'<div class="empty-state-small">Cadastre o primeiro produto da sua loja.</div>'}</div></div>`;
    const editing=(prodRes.data||[]).find(p=>p.id===editId);
    const f=document.getElementById('produtoLojaForm');
    if(editing){for(const k of ['nome','preco','quantidade','tempo_producao','categoria_id','descricao'])if(f.elements[k])f.elements[k].value=editing[k]??'';f.elements.mostrar_catalogo.value=String(editing.mostrar_catalogo!==false)}
    f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const id=fd.get('id');let foto=editing?.foto||null;if(fd.get('foto')?.size)foto=await upload('produtos',fd.get('foto'),u.id);const payload={nome:String(fd.get('nome')).trim(),descricao:String(fd.get('descricao')||'').trim()||null,preco:Number(fd.get('preco')),quantidade:Number(fd.get('quantidade')),tempo_producao:fd.get('tempo_producao')?Number(fd.get('tempo_producao')):null,categoria_id:fd.get('categoria_id')?Number(fd.get('categoria_id')):null,mostrar_catalogo:fd.get('mostrar_catalogo')==='true',foto};const r=id?await supabaseClient.from('produtos').update(payload).eq('id',id).eq('usuario_id',u.id):await supabaseClient.from('produtos').insert({...payload,usuario_id:u.id});if(r.error)msg(r.error.message,false);else{msg(id?'Produto atualizado!':'Produto cadastrado!');editId=null;await load()}};
    document.getElementById('cancelEdit')?.addEventListener('click',()=>{editId=null;load()});
    root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editId=Number(b.dataset.edit);load()});
    root.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Excluir este produto?'))return;const {error}=await supabaseClient.from('produtos').delete().eq('id',b.dataset.delete).eq('usuario_id',u.id);if(error)msg(error.message,false);else load()});
  }
  await load();return {load};
}