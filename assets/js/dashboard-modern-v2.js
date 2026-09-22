(function(){
'use strict';
if(!/dashboard\.html$/.test(location.pathname)) return;
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const date=s=>s?new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'—';
const pct=(a,b)=>b?Math.round(a/b*100):0;
function style(){
 const id='km-dashboard-v2-css';if(document.getElementById(id))return;
 const s=document.createElement('style');s.id=id;s.textContent=`
.km-v2{--b:#6b4e3d;--bd:#eadfd5;--bg:#f7f3ee;--soft:#f3e7dc;--tx:#302823;--mut:#8b7c72;--ok:#27855a;display:block;color:var(--tx)}
.km-v2 *{box-sizing:border-box}.km-v2 a{text-decoration:none;color:inherit}.km-v2 .welcome{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:30px 34px;border:1px solid var(--bd);border-radius:24px;background:linear-gradient(135deg,#fff,#f1e1d3);box-shadow:0 12px 34px rgba(66,48,38,.07);margin-bottom:18px;overflow:hidden;position:relative}.km-v2 .welcome:after{content:'🧶';position:absolute;right:35px;bottom:-25px;font-size:120px;opacity:.13;transform:rotate(-18deg)}
.km-v2 .eyebrow{font-size:10px;letter-spacing:2px;font-weight:850;color:#9b7255}.km-v2 h2{font-size:29px;line-height:1.15;letter-spacing:-.8px;margin:7px 0 8px}.km-v2 .welcome p{margin:0;color:var(--mut);font-size:14px}.km-v2 .primary{position:relative;z-index:1;background:var(--b);color:#fff;padding:12px 17px;border-radius:12px;font-weight:750;white-space:nowrap}
.km-v2 .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.km-v2 .stat,.km-v2 .panel,.km-v2 .quick{background:#fff;border:1px solid var(--bd);box-shadow:0 12px 34px rgba(66,48,38,.06)}.km-v2 .stat{min-height:128px;border-radius:18px;padding:19px;display:flex;gap:13px;align-items:flex-start}.km-v2 .icon{width:45px;height:45px;border-radius:13px;background:var(--soft);display:grid;place-items:center;font-size:20px;flex:none}.km-v2 .stat small{display:block;color:var(--mut);font-size:11px;margin-bottom:4px}.km-v2 .stat strong{display:block;font-size:22px;letter-spacing:-.5px}.km-v2 .trend{color:var(--ok);font-size:11px;margin-top:7px;font-weight:700}
.km-v2 .grid{display:grid;grid-template-columns:1.35fr .9fr 1.05fr;gap:18px;margin-bottom:18px}.km-v2 .panel{border-radius:20px;padding:22px;min-width:0}.km-v2 .panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}.km-v2 .panel-head h3{font-size:17px;margin:0}.km-v2 .panel-head span{font-size:11px;color:var(--mut)}
.km-v2 .chart{height:230px;display:flex;align-items:stretch;gap:8px}.km-v2 .chart-y{width:36px;display:flex;flex-direction:column;justify-content:space-between;color:#a2948a;font-size:9px;padding-bottom:24px}.km-v2 .chart-main{position:relative;flex:1;display:flex;align-items:flex-end;gap:10px;border-left:1px solid #eee5de;border-bottom:1px solid #eee5de;padding:12px 8px 0}.km-v2 .chart-main:before{content:'';position:absolute;inset:12px 8px 24px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 32px,#f0e8e2 33px);pointer-events:none}.km-v2 .bar{position:relative;z-index:1;flex:1;max-width:44px;margin:0 auto;height:var(--h);min-height:5px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,#c99a70,#6b4e3d)}.km-v2 .bar:after{content:attr(data-label);position:absolute;top:calc(100% + 7px);left:50%;transform:translateX(-50%);font-size:9px;color:#8b7c72;white-space:nowrap}.km-v2 .bar em{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:8px;font-style:normal;color:#765b4a;white-space:nowrap}
.km-v2 .ranking{display:flex;flex-direction:column}.km-v2 .rank{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f0e7df}.km-v2 .rank:last-child{border:0}.km-v2 .rank-no{width:20px;font-size:11px;color:#8b7c72}.km-v2 .thumb{width:40px;height:40px;border-radius:10px;background:var(--soft);display:grid;place-items:center;overflow:hidden;flex:none}.km-v2 .thumb img{width:100%;height:100%;object-fit:cover}.km-v2 .rank-info{min-width:0;flex:1}.km-v2 .rank-info b{font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.km-v2 .rank-info small{font-size:10px;color:var(--mut)}.km-v2 .rank-value{font-size:11px;font-weight:750}
.km-v2 .sales{width:100%;border-collapse:collapse}.km-v2 .sales th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.7px;color:#9b8c82;padding:0 0 10px}.km-v2 .sales td{padding:10px 0;border-top:1px solid #f0e7df;font-size:11px}.km-v2 .badge{display:inline-block;padding:5px 8px;border-radius:999px;background:#e8f5ed;color:#27855a;font-size:9px;font-weight:800}.km-v2 .badge.pending{background:#fff1dd;color:#b86d16}
.km-v2 .bottom{display:grid;grid-template-columns:1.5fr .8fr;gap:18px}.km-v2 .activity{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0e7df;font-size:11px}.km-v2 .dot{width:8px;height:8px;border-radius:50%;background:#c99a70;flex:none}.km-v2 .activity small{display:block;color:var(--mut);margin-top:2px}.km-v2 .quickgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.km-v2 .quick{padding:15px;border-radius:15px;display:flex;gap:10px;align-items:center}.km-v2 .quick .icon{width:36px;height:36px;font-size:16px}.km-v2 .quick b{font-size:11px}.km-v2 .quick small{display:block;color:var(--mut);font-size:9px;margin-top:2px}
@media(max-width:1100px){.km-v2 .grid{grid-template-columns:1fr 1fr}.km-v2 .grid .panel:last-child{grid-column:1/-1}.km-v2 .stats{grid-template-columns:1fr 1fr}}@media(max-width:700px){.km-v2 .welcome{display:block;padding:24px}.km-v2 .primary{display:inline-block;margin-top:18px}.km-v2 .stats,.km-v2 .grid,.km-v2 .bottom{grid-template-columns:1fr}.km-v2 .grid .panel:last-child{grid-column:auto}.km-v2 .quickgrid{grid-template-columns:1fr}.km-v2 .welcome:after{right:-15px}}
`;
 document.head.appendChild(s);
}
async function render(){
 if(typeof q!=='function')return;
 style();
 const root=document.getElementById('content');if(!root)return;
 const rs=await Promise.allSettled([q('vendas'),q('compras'),q('encomendas'),q('produtos'),q('leads')]);
 const data=i=>rs[i]?.status==='fulfilled'?(rs[i].value?.data||[]):[];
 const vendas=data(0),compras=data(1),encomendas=data(2),produtos=data(3),leads=data(4);
 const total=vendas.reduce((a,x)=>a+Number(x.valor||0),0), comprasTotal=compras.reduce((a,x)=>a+Number(x.valor||0),0);
 const ticket=vendas.length?total/vendas.length:0;
 const pend=encomendas.filter(x=>!['Entregue','Concluída','Concluido'].includes(x.status||'')).length;
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);return d});
 const vals=days.map(d=>vendas.filter(x=>{const xdate=new Date(x.data||0);return xdate.toDateString()===d.toDateString()}).reduce((a,x)=>a+Number(x.valor||0),0));
 const vmax=Math.max(...vals,1);
 const ranked=[...produtos].sort((a,b)=>Number(b.quantidade_vendida||b.vendas||0)-Number(a.quantidade_vendida||a.vendas||0)).slice(0,5);
 const recent=vendas.slice().sort((a,b)=>new Date(b.data||0)-new Date(a.data||0)).slice(0,5);
 const activities=[...vendas.map(x=>({t:'Nova venda registrada',d:x.data,n:x.cliente||x.produto||'Cliente'})),...produtos.map(x=>({t:'Produto cadastrado',d:x.created_at,n:x.nome}))].sort((a,b)=>new Date(b.d||0)-new Date(a.d||0)).slice(0,5);
 root.innerHTML=`<div class="km-v2">
 <section class="welcome"><div><span class="eyebrow">BEM-VINDO AO KROCHE MANAGER</span><h2>Organize seu negócio de forma simples e eficiente</h2><p>Gerencie produtos, vendas, clientes e seu catálogo em um só lugar.</p></div><a class="primary" href="minha-loja.html">Ver minha loja&nbsp; →</a></section>
 <section class="stats">
 <div class="stat"><span class="icon">📦</span><div><small>Total de produtos</small><strong>${produtos.length}</strong><div class="trend">↑ ${produtos.length?100:0}% no catálogo</div></div></div>
 <div class="stat"><span class="icon">💰</span><div><small>Vendas realizadas</small><strong>${money(total)}</strong><div class="trend">↑ ${vendas.length} venda(s)</div></div></div>
 <div class="stat"><span class="icon">👥</span><div><small>Clientes / leads</small><strong>${leads.length}</strong><div class="trend">↑ base de clientes</div></div></div>
 <div class="stat"><span class="icon">📊</span><div><small>Ticket médio</small><strong>${money(ticket)}</strong><div class="trend">Resultado atual</div></div></div></section>
 <section class="grid">
 <div class="panel"><div class="panel-head"><h3>Vendas dos últimos 7 dias</h3><span>Hoje</span></div><div class="chart"><div class="chart-y"><span>${money(vmax)}</span><span>${money(vmax*.66)}</span><span>${money(vmax*.33)}</span><span>R$ 0</span></div><div class="chart-main">${vals.map((v,i)=>`<div class="bar" style="--h:${Math.max(5,v/vmax*82)}%" data-label="${days[i].getDate()}/${days[i].getMonth()+1}"><em>${money(v)}</em></div>`).join('')}</div></div></div>
 <div class="panel"><div class="panel-head"><h3>Produtos mais vendidos</h3><span>${produtos.length} cadastrados</span></div><div class="ranking">${ranked.map((x,i)=>`<div class="rank"><span class="rank-no">${i+1}</span><span class="thumb">${x.foto?`<img src="${esc(x.foto)}">`:'🧶'}</span><span class="rank-info"><b>${esc(x.nome)}</b><small>${Number(x.quantidade_vendida||x.vendas||0)} vendas</small></span><span class="rank-value">${money(x.preco)}</span></div>`).join('')||'<p class="muted">Cadastre produtos para ver o ranking.</p>'}</div></div>
 <div class="panel"><div class="panel-head"><h3>Vendas recentes</h3><a href="vendas.html"><span>Ver todas →</span></a></div><table class="sales"><thead><tr><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead><tbody>${recent.map(x=>`<tr><td>${esc(x.cliente||x.produto||'Cliente')}</td><td>${money(x.valor)}</td><td><span class="badge ${String(x.status||'').toLowerCase().includes('pend')?'pending':''}">${esc(x.status||'Pago')}</span></td></tr>`).join('')||'<tr><td colspan="3">Nenhuma venda registrada.</td></tr>'}</tbody></table></div>
 </section>
 <section class="bottom"><div class="panel"><div class="panel-head"><h3>Atividades recentes</h3><span>${encomendas.length} encomenda(s)</span></div>${activities.map((x,i)=>`<div class="activity"><span class="dot"></span><div><b>${esc(x.t)}</b><small>${esc(x.n||'')} · ${date(x.d)}</small></div></div>`).join('')||'<div class="activity">Nenhuma atividade ainda.</div>'}</div>
 <div class="panel"><div class="panel-head"><h3>Ações rápidas</h3><span>Atalhos</span></div><div class="quickgrid"><a class="quick" href="produtos.html"><span class="icon">📦</span><span><b>Cadastrar produto</b><small>Novo item</small></span></a><a class="quick" href="vendas.html"><span class="icon">🛒</span><span><b>Nova venda</b><small>Registrar venda</small></span></a><a class="quick" href="leads.html"><span class="icon">👥</span><span><b>Novo cliente</b><small>Adicionar contato</small></span></a><a class="quick" href="relatorios.html"><span class="icon">📊</span><span><b>Relatórios</b><small>Ver resultados</small></span></a></div></div></section>
 </div>`;
}
function boot(){if(location.pathname.endsWith('dashboard.html'))setTimeout(render,80)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
