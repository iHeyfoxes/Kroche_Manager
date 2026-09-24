/* initEncomendas - pedidos manuais e pedidos recebidos pelo catálogo. */
async function initEncomendas(){
  layout();await shell('Encomendas');const u=await user();if(!u)return;
  async function load(){
    const {data,error}=await q('encomendas');
    if(error){msg(error.message,false);return}
    const rows=(data||[]).map(x=>{
      const catalogo=!!x.pedido_catalogo_id;
      const action=catalogo&&x.status!=='Cancelado'
        ? '<button class="btn btn-danger btn-sm" data-cancel-pedido="'+x.pedido_catalogo_id+'">Cancelar</button>'
        : '<button class="btn btn-danger btn-sm" data-id="'+x.id+'">Excluir</button>';
      return '<tr><td>'+(catalogo?'<strong>#'+x.pedido_catalogo_id+'</strong> ':'')+(x.data_entrega?new Date(x.data_entrega+'T00:00:00').toLocaleDateString('pt-BR'):'-')+'</td><td>'+esc(x.cliente)+'</td><td>'+esc(x.produto)+'</td><td>'+money(x.valor)+'</td><td><span class="pill">'+esc(x.status)+'</span></td><td><span class="pill '+(catalogo?'success':'')+'">'+(catalogo?'Catálogo':'Manual')+'</span></td><td><a class="btn btn-secondary btn-sm" href="editar-encomenda.html?id='+x.id+'">Editar</a> '+action+'</td></tr>';
    }).join('');
    document.getElementById('list').innerHTML=rows||'<tr><td colspan="8" class="muted">Nenhuma encomenda.</td></tr>';
    document.querySelectorAll('#list [data-cancel-pedido]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Cancelar este pedido? O estoque dos produtos será devolvido.'))return;
      const r=await supabaseClient.rpc('cancelar_pedido_catalogo',{p_pedido_id:Number(b.dataset.cancelPedido)});
      if(r.error||!r.data?.sucesso)msg(r.error?.message||'Não foi possível cancelar o pedido.',false);else{msg('Pedido cancelado e estoque devolvido.');load()}
    });
    document.querySelectorAll('#list [data-id]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir encomenda?')){await del('encomendas',b.dataset.id);load()}});
  }
  document.getElementById('content').innerHTML='<div class="card"><h3>Nova encomenda</h3><form id="f" class="grid grid-4">'+formField('Cliente','cliente','text','required')+formField('Telefone','telefone')+formField('Produto','produto','text','required')+formField('Valor total','valor','number','step="0.01" min="0" required')+formField('Sinal','sinal','number','step="0.01" min="0" value="0"')+formField('Entrega','data_entrega','date')+'<div><label class="label">Status</label><select class="select" name="status"><option>Pendente</option><option>Em produção</option><option>Pronto</option><option>Entregue</option></select></div><div style="grid-column:1/-1">'+formField('Observações','observacoes')+'</div><button class="btn btn-primary">Salvar</button></form></div><div class="card"><h3>Encomendas</h3><div class="table-wrap"><table class="table"><thead><tr><th>Pedido</th><th>Entrega</th><th>Cliente</th><th>Produto</th><th>Valor</th><th>Status</th><th>Origem</th><th>Ações</th></tr></thead><tbody id="list"></tbody></table></div></div>';
  document.getElementById('f').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await supabaseClient.from('encomendas').insert({cliente:f.get('cliente'),telefone:f.get('telefone'),produto:f.get('produto'),valor:Number(f.get('valor')),sinal:Number(f.get('sinal')||0),data_entrega:f.get('data_entrega')||null,status:f.get('status'),observacoes:f.get('observacoes'),user_id:u.id});if(error)msg(error.message,false);else{msg('Encomenda salva!');e.target.reset();load()}};
  load();
}