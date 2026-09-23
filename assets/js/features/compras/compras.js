/* initCompras - compras integradas ao estoque via RPC transacional. */
async function initCompras(){
  layout();await shell('Compras');const u=await user();if(!u)return;
  async function load(){
    const {data,error}=await q('compras');
    if(error){msg(error.message,false);return}
    const total=(data||[]).reduce((a,x)=>a+Number(x.valor||0),0);
    document.getElementById('total').textContent=money(total);
    document.getElementById('list').innerHTML=(data||[]).map(x=>'<tr><td>'+new Date(x.data).toLocaleDateString('pt-BR')+'</td><td>'+esc(x.material)+'</td><td>'+esc(x.fornecedor)+'</td><td>'+Number(x.quantidade||0)+'</td><td>'+money(x.valor)+'</td><td><button class="btn btn-danger btn-sm" data-id="'+x.id+'">Excluir</button></td></tr>').join('')||'<tr><td colspan="6" class="muted">Nenhuma compra.</td></tr>';
    document.querySelectorAll('#list button').forEach(b=>b.onclick=async()=>{
      if(!confirm('Excluir compra? A quantidade será retirada do estoque somente se ainda estiver disponível.'))return;
      const r=await supabaseClient.rpc('excluir_compra_estoque',{p_compra_id:Number(b.dataset.id)});
      if(r.error||!r.data?.sucesso){msg(r.error?.message||'Não foi possível excluir a compra.',false);return}
      msg('Compra excluída e estoque atualizado.');load();
    });
  }
  document.getElementById('content').innerHTML='<div class="card"><h3>Registrar compra</h3><form id="f" class="grid grid-4">'+formField('Material','material','text','required')+formField('Fornecedor','fornecedor','text')+formField('Quantidade','quantidade','number','min="1" step="1" required')+formField('Valor total (R$)','valor','number','step="0.01" min="0" required')+'<button class="btn btn-primary">Salvar</button></form><p class="muted">Ao registrar a compra, o material entra automaticamente no estoque.</p></div><div class="card"><h3>Histórico — <span id="total"></span></h3><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Material</th><th>Fornecedor</th><th>Qtd.</th><th>Valor</th><th>Ações</th></tr></thead><tbody id="list"></tbody></table></div></div>';
  document.getElementById('f').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target),btn=e.target.querySelector('button[type=submit],button');
    btn.disabled=true;btn.textContent='Salvando...';
    const r=await supabaseClient.rpc('registrar_compra_estoque',{p_material:String(f.get('material')||'').trim(),p_fornecedor:String(f.get('fornecedor')||'').trim(),p_quantidade:Number(f.get('quantidade')),p_valor:Number(f.get('valor'))});
    if(r.error||!r.data?.sucesso){msg(r.error?.message||'Não foi possível registrar a compra.',false)}
    else{msg('Compra registrada e estoque atualizado!');e.target.reset();load()}
    btn.disabled=false;btn.textContent='Salvar';
  };
  load();
}