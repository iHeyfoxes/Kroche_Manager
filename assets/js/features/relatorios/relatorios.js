/* initRelatorios - visão financeira por período. */
async function initRelatorios(){
  layout(); await shell('Relatórios'); const u=await user(); if(!u)return;
  document.getElementById('content').innerHTML=`
  <div class="card"><h3>Filtrar período</h3>
    <div class="grid grid-2">${formField('Dia','dia','date')}${formField('Mês','mes','month')}</div>
    <div class="actions" style="margin-top:12px"><button id="filtrar" class="btn btn-primary">Filtrar</button><button id="pdf" class="btn btn-secondary">Exportar PDF</button><button id="csv" class="btn btn-secondary">Exportar CSV</button></div>
  </div>
  <div class="grid grid-3" id="stats"></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Tipo</th><th>Data</th><th>Descrição</th><th>Cliente / Fornecedor</th><th>Valor</th></tr></thead><tbody id="list"></tbody></table></div></div>`;
  let rows=[];
  function range(){
    const dia=document.querySelector('[name=dia]').value,mes=document.querySelector('[name=mes]').value;
    if(dia)return {start:dia+'T00:00:00',end:dia+'T23:59:59',label:dia};
    if(mes){const [y,m]=mes.split('-');const next=new Date(Number(y),Number(m),1);return {start:mes+'-01T00:00:00',end:next.toISOString(),label:mes};}
    return {start:null,end:null,label:'Geral'};
  }
  async function load(){
    const r=range();
    let vq=supabaseClient.from('vendas').select('*').eq('user_id',u.id).order('data',{ascending:false});
    let cq=supabaseClient.from('compras').select('*').eq('user_id',u.id).order('data',{ascending:false});
    let pq=supabaseClient.from('pedidos_catalogo').select('*').eq('usuario_id',u.id).neq('status','Cancelado').order('data',{ascending:false});
    if(r.start){vq=vq.gte('data',r.start).lte('data',r.end);cq=cq.gte('data',r.start).lte('data',r.end);pq=pq.gte('data',r.start).lte('data',r.end);}
    const [vr,cr,pr]=await Promise.all([vq,cq,pq]);
    if(vr.error){msg(vr.error.message,false);return}
    if(cr.error){msg(cr.error.message,false);return}
    if(pr.error){msg(pr.error.message,false);return}
    const vendas=(vr.data||[]).map(x=>({tipo:'Venda',data:x.data,descricao:x.produto||'Venda',pessoa:x.cliente||'-',valor:Number(x.valor||0)}));
    const catalogoVendas=(pr.data||[]).map(x=>({tipo:'Venda catálogo',data:x.data,descricao:'Pedido #'+x.id,pessoa:x.cliente||'-',valor:Number(x.total||0)}));
    const compras=(cr.data||[]).map(x=>({tipo:'Compra',data:x.data,descricao:x.material||'Compra',pessoa:x.fornecedor||'-',valor:Number(x.valor||0)}));
    rows=[...vendas,...catalogoVendas,...compras].sort((a,b)=>new Date(b.data||0)-new Date(a.data||0));
    const totalV=[...vendas,...catalogoVendas].reduce((a,x)=>a+x.valor,0),totalC=compras.reduce((a,x)=>a+x.valor,0);
    document.getElementById('stats').innerHTML=`<div class="card"><div class="muted">Vendas no período</div><div class="stat">${money(totalV)}</div><small>${vendas.length} venda(s)</small></div><div class="card"><div class="muted">Despesas no período</div><div class="stat">${money(totalC)}</div><small>${compras.length} compra(s)</small></div><div class="card"><div class="muted">Lucro simplificado</div><div class="stat">${money(totalV-totalC)}</div><small>Vendas menos compras</small></div>`;
    document.getElementById('list').innerHTML=rows.map(x=>`<tr><td><span class="pill ${x.tipo==='Venda'?'success':'danger'}">${x.tipo}</span></td><td>${x.data?new Date(x.data).toLocaleDateString('pt-BR'):'-'}</td><td>${esc(x.descricao)}</td><td>${esc(x.pessoa)}</td><td>${money(x.valor)}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">Nenhuma movimentação no período.</td></tr>';
  }
  document.getElementById('filtrar').onclick=load;
  document.getElementById('csv').onclick=()=>{const lines=[['Tipo','Data','Descrição','Cliente / Fornecedor','Valor'],...rows.map(x=>[x.tipo,x.data?new Date(x.data).toLocaleDateString('pt-BR'):'-',x.descricao,x.pessoa,x.valor])];const blob=new Blob([lines.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(';')).join('\\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='relatorio-kroche.csv';a.click();URL.revokeObjectURL(a.href)};
  document.getElementById('pdf').onclick=()=>{if(!window.jspdf)return window.print();const {jsPDF}=window.jspdf;const doc=new jsPDF();doc.text('Kroche Manager — Relatório financeiro',14,18);doc.text('Período: '+range().label,14,27);doc.autoTable({head:[['Tipo','Data','Descrição','Cliente / Fornecedor','Valor']],body:rows.map(x=>[x.tipo,x.data?new Date(x.data).toLocaleDateString('pt-BR'):'-',x.descricao,x.pessoa,money(x.valor)]),startY:34});doc.save('relatorio-kroche-'+(range().label||'periodo')+'.pdf')};
  load();
}