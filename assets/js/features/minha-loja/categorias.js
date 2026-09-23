/* Gestão de categorias do catálogo. */
async function initCategoriasLoja(container){
  const u=await user();if(!u)return;
  const root=document.getElementById(container);if(!root)return;
  async function load(){
    const {data,error}=await supabaseClient.from('categorias_produtos').select('*').eq('usuario_id',u.id).order('nome');
    if(error){root.innerHTML='<div class="inline-error">'+esc(error.message)+'</div>';return}
    root.innerHTML=(data||[]).map(c=>`<div class="store-list-row"><div><b>${esc(c.nome)}</b><small>Categoria do catálogo</small></div><div class="row-actions"><button class="btn btn-secondary btn-sm" data-edit-cat="${c.id}">Editar</button><button class="btn btn-danger btn-sm" data-cat="${c.id}">Excluir</button></div></div>`).join('')||'<div class="empty-state-small">Nenhuma categoria criada ainda.</div>';
    root.querySelectorAll('[data-edit-cat]').forEach(b=>b.onclick=async()=>{const item=(data||[]).find(c=>String(c.id)===String(b.dataset.editCat));const nome=prompt('Nome da categoria:',item?.nome||'');if(!nome||!nome.trim())return;const clean=nome.trim();const slug=clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const {error}=await supabaseClient.from('categorias_produtos').update({nome:clean,slug,atualizado_em:new Date().toISOString()}).eq('id',b.dataset.editCat).eq('usuario_id',u.id);if(error)msg(error.code==='23505'?'Essa categoria já existe.':error.message,false);else load()});root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=async()=>{if(!confirm('Excluir esta categoria? Os produtos continuarão cadastrados.'))return;const catId=Number(b.dataset.cat);const {error:unlinkError}=await supabaseClient.from('produtos').update({categoria_id:null,categoria:null}).eq('categoria_id',catId).eq('usuario_id',u.id);if(unlinkError){msg(unlinkError.message,false);return}const {error}=await supabaseClient.from('categorias_produtos').delete().eq('id',catId).eq('usuario_id',u.id);if(error)msg(error.message,false);else load()});
  }
  await load();
  return {load};
}