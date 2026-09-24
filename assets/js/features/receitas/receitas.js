/* initReceitas - gestão e busca de receitas do usuário. */
async function initReceitas(){
  layout();await shell('Receitas');const u=await user();if(!u)return;
  let receitas=[];
  document.getElementById('content').innerHTML=`
  <div class="card">
    <h3>Adicionar receita</h3>
    <form id="f" class="grid grid-3">
      ${formField('Nome','nome','text','required')}
      ${formField('Autor','autor')}
      ${formField('Categoria','categoria')}
      <div><label class="label">Nível</label><select class="select" name="nivel"><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></div>
      ${formField('YouTube','youtube','url')}
      ${formField('PDF','pdf','url')}
      <div style="grid-column:1/-1">${formField('Observações','observacoes')}</div>
      <label><input type="checkbox" name="favorito"> Favorita</label>
      <button class="btn btn-primary">Salvar receita</button>
    </form>
  </div>
  <div class="card">
    <div class="panel-heading">
      <div><span class="panel-kicker">BIBLIOTECA</span><h3>Suas receitas</h3></div>
      <span class="pill" id="receitasCount">0 receitas</span>
    </div>
    <div class="grid grid-3" style="margin-bottom:16px">
      ${formField('Buscar','busca','search','placeholder="Nome, autor ou categoria"')}
      <div><label class="label">Categoria</label><select class="select" id="filtroCategoria"><option value="todas">Todas</option></select></div>
      <label style="display:flex;align-items:end;gap:8px;padding-bottom:8px"><input type="checkbox" id="filtroFavoritas"> Somente favoritas</label>
    </div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>Autor</th><th>Categoria</th><th>Nível</th><th>Links</th><th>Ações</th></tr></thead><tbody id="list"></tbody></table></div>
  </div>`;
  const escSafe=v=>esc(v);
  function render(){
    const busca=String(document.querySelector('[name=busca]').value||'').trim().toLowerCase();
    const categoria=document.getElementById('filtroCategoria').value;
    const favoritas=document.getElementById('filtroFavoritas').checked;
    const filtradas=receitas.filter(x=>{
      const texto=[x.nome,x.autor,x.categoria,x.observacoes].map(v=>String(v||'').toLowerCase()).join(' ');
      return (!busca||texto.includes(busca))&&(categoria==='todas'||String(x.categoria||'')===categoria)&&(!favoritas||x.favorito);
    });
    document.getElementById('receitasCount').textContent=filtradas.length+' receita(s)';
    document.getElementById('list').innerHTML=filtradas.map(x=>`<tr>
      <td>${x.favorito?'⭐ ':''}${escSafe(x.nome)}</td><td>${escSafe(x.autor||'-')}</td><td>${escSafe(x.categoria||'-')}</td><td>${escSafe(x.nivel||'-')}</td>
      <td>${x.youtube?`<a href="${escSafe(x.youtube)}" target="_blank" rel="noopener noreferrer">▶️ YouTube</a>`:''} ${x.pdf?`<a href="${escSafe(x.pdf)}" target="_blank" rel="noopener noreferrer">📄 PDF</a>`:''}</td>
      <td><button class="btn btn-secondary btn-sm" data-fav="${x.id}">${x.favorito?'Desfavoritar':'Favoritar'}</button> <button class="btn btn-danger btn-sm" data-id="${x.id}">Excluir</button></td>
    </tr>`).join('')||'<tr><td colspan="6" class="muted">Nenhuma receita encontrada.</td></tr>';
    document.querySelectorAll('#list [data-fav]').forEach(b=>b.onclick=async()=>{
      const item=receitas.find(x=>String(x.id)===String(b.dataset.fav));if(!item)return;
      const {error}=await supabaseClient.from('receitas').update({favorito:!item.favorito}).eq('id',item.id).eq('user_id',u.id);
      if(error)msg(error.message,false);else{item.favorito=!item.favorito;render()}
    });
    document.querySelectorAll('#list [data-id]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir receita?')){await del('receitas',b.dataset.id);receitas=receitas.filter(x=>String(x.id)!==String(b.dataset.id));render()}});
  }
  async function load(){
    const {data,error}=await q('receitas');
    if(error){msg(error.message,false);return}
    receitas=data||[];
    const cats=[...new Set(receitas.map(x=>String(x.categoria||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    document.getElementById('filtroCategoria').innerHTML='<option value="todas">Todas</option>'+cats.map(c=>'<option value="'+escSafe(c)+'">'+escSafe(c)+'</option>').join('');
    render();
  }
  document.querySelector('[name=busca]').oninput=render;
  document.getElementById('filtroCategoria').onchange=render;
  document.getElementById('filtroFavoritas').onchange=render;
  document.getElementById('f').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.target);
    const {error}=await supabaseClient.from('receitas').insert({nome:f.get('nome'),autor:f.get('autor'),categoria:f.get('categoria'),nivel:f.get('nivel'),youtube:f.get('youtube'),pdf:f.get('pdf'),observacoes:f.get('observacoes'),favorito:f.has('favorito'),user_id:u.id});
    if(error)msg(error.message,false);else{msg('Receita salva!');e.target.reset();await load()}
  };
  load();
}