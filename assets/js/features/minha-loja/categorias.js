/* Gestão de categorias do catálogo. */
async function initCategoriasLoja(container){
  const u=await user();if(!u)return;
  const root=document.getElementById(container);if(!root)return;
  async function load(){
    const {data,error}=await supabaseClient.from('categorias_produtos').select('*').eq('usuario_id',u.id).order('nome');
    if(error){root.innerHTML='<div class="inline-error">'+esc(error.message)+'</div>';return}
    root.innerHTML=(data||[]).map(c=>`<div class="store-list-row"><div><b>${esc(c.nome)}</b><small>Categoria do catálogo</small></div><button class="btn btn-danger btn-sm" data-cat="${c.id}">Excluir</button></div>`).join('')||'<div class="empty-state-small">Nenhuma categoria criada ainda.</div>';
    root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=async()=>{if(!confirm('Excluir esta categoria? Os produtos continuarão cadastrados.'))return;const {error}=await supabaseClient.from('categorias_produtos').delete().eq('id',b.dataset.cat).eq('usuario_id',u.id);if(error)msg(error.message,false);else load()});
  }
  await load();
  return {load};
}