/* initEditEncomenda */
async function initEditEncomenda(){
  layout();await shell('Editar Encomenda');
  const u=await user(),id=new URLSearchParams(location.search).get('id');
  const {data,error}=await supabaseClient.from('encomendas').select('*').eq('id',id).eq('user_id',u.id).single();
  if(error||!data)return msg('Encomenda não encontrada.',false);
  const catalogo=!!data.pedido_catalogo_id;
  document.getElementById('content').innerHTML=`<div class="card"><form id="f" class="grid grid-2">${formField('Cliente','cliente')}${formField('Telefone','telefone')}${formField('Produto','produto')}${formField('Valor','valor','number','step="0.01")}${formField('Sinal','sinal','number','step="0.01")}${formField('Entrega','data_entrega','date')}<div><label class="label">Status</label><select class="select" name="status">${catalogo?'<option>Pendente</option><option>Confirmado</option><option>Em produção</option><option>Pronto</option><option>Entregue</option><option>Cancelado</option>':'<option>Pendente</option><option>Em produção</option><option>Pronto</option><option>Entregue</option>'}</select></div><button class="btn btn-primary">Salvar</button></form></div>`;
  for(const k of ['cliente','telefone','produto','valor','sinal','data_entrega','status'])document.querySelector(`[name=${k}]`).value=data[k]??'';
  document.getElementById('f').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.target),status=f.get('status');
    if(catalogo&&status==='Cancelado'){
      const r=await supabaseClient.rpc('cancelar_pedido_catalogo',{p_pedido_id:Number(data.pedido_catalogo_id)});
      if(r.error||!r.data?.sucesso){msg(r.error?.message||'Não foi possível cancelar o pedido.',false);return}
      location.href='encomendas.html';return;
    }
    const {error:updateError}=await supabaseClient.from('encomendas').update({cliente:f.get('cliente'),telefone:f.get('telefone'),produto:f.get('produto'),valor:+f.get('valor'),sinal:+f.get('sinal'),data_entrega:f.get('data_entrega')||null,status}).eq('id',id).eq('user_id',u.id);
    if(updateError){msg(updateError.message,false);return}
    if(catalogo){
      const {error:pedidoError}=await supabaseClient.from('pedidos_catalogo').update({cliente:f.get('cliente'),telefone:f.get('telefone'),total:+f.get('valor'),status,atualizado_em:new Date().toISOString()}).eq('id',data.pedido_catalogo_id).eq('usuario_id',u.id);
      if(pedidoError){msg(pedidoError.message,false);return}
    }
    location.href='encomendas.html';
  };
}