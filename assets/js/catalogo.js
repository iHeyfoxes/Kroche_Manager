/* Kroche Manager — catálogo público baseado no modelo visual aprovado. */
const catalogoParams=new URLSearchParams(location.search);
const catalogoSlug=(catalogoParams.get('slug')||'').trim();
const catalogoMoney=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const catalogoEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let catalogoLoja=null,catalogoProdutos=[],catalogoBusca='',catalogoCategoria='todos',catalogoOrdenacao='recentes',catalogoEstoque=false,catalogoPrecoMax=0;
const catalogoStorageKey=tipo=>'km_catalogo_'+tipo+'_'+(catalogoSlug||'sem-loja');
let catalogoCarrinho=JSON.parse(localStorage.getItem(catalogoStorageKey('carrinho'))||'[]');
let catalogoFavoritos=JSON.parse(localStorage.getItem(catalogoStorageKey('favoritos'))||'[]');

function catalogoSave(){localStorage.setItem(catalogoStorageKey('carrinho'),JSON.stringify(catalogoCarrinho))}
function catalogoFavSave(){localStorage.setItem(catalogoStorageKey('favoritos'),JSON.stringify(catalogoFavoritos))}
function catalogoQtd(){return catalogoCarrinho.reduce((s,i)=>s+Number(i.quantidade||0),0)}
function catalogoCategorias(){return [...new Set(catalogoProdutos.filter(p=>p.mostrar_catalogo).map(p=>String(p.categoria||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function catalogoLista(){
 let a=catalogoProdutos.filter(p=>p.mostrar_catalogo);
 if(catalogoCategoria!=='todos')a=a.filter(p=>String(p.categoria||'').trim()===catalogoCategoria);
 const b=catalogoBusca.toLowerCase();
 if(b)a=a.filter(p=>String(p.nome||'').toLowerCase().includes(b)||String(p.descricao||'').toLowerCase().includes(b)||String(p.categoria||'').toLowerCase().includes(b));
 if(catalogoEstoque)a=a.filter(p=>Number(p.quantidade||0)>0);
 if(catalogoPrecoMax)a=a.filter(p=>Number(p.preco||0)<=catalogoPrecoMax);
 if(catalogoOrdenacao==='menor-preco')a.sort((x,y)=>Number(x.preco||0)-Number(y.preco||0));
 if(catalogoOrdenacao==='maior-preco')a.sort((x,y)=>Number(y.preco||0)-Number(x.preco||0));
 if(catalogoOrdenacao==='nome')a.sort((x,y)=>String(x.nome||'').localeCompare(String(y.nome||''),'pt-BR'));
 if(catalogoOrdenacao==='favoritos')a.sort((x,y)=>Number(catalogoFavoritos.includes(y.id))-Number(catalogoFavoritos.includes(x.id)));
 return a;
}
function catalogoImg(p){return p.foto?'<img src="'+catalogoEsc(p.foto)+'" alt="'+catalogoEsc(p.nome)+'" loading="lazy">':'<div class="catalogo-sem-foto">🧶</div>'}
function catalogoToast(t,err=false){const e=document.getElementById('catalogoToast');if(!e)return;e.textContent=t;e.className='catalogo-toast show'+(err?' erro':'');clearTimeout(window.kmToast);window.kmToast=setTimeout(()=>e.classList.remove('show'),2400)}
function catalogoCount(){document.querySelectorAll('#contadorCarrinho,.catalogo-carrinho-badge').forEach(e=>e.textContent=catalogoQtd())}
function catalogoCategoriasRender(){
 const e=document.getElementById('catalogoCategorias');if(!e)return;
 const cats=catalogoCategorias(),icons=['🐻','⌂','👜','🎁'];
 e.innerHTML=cats.map((c,i)=>'<button class="catalogo-categoria '+(catalogoCategoria===c?'ativo':'')+'" data-cat="'+catalogoEsc(c)+'"><span>'+icons[i%4]+'</span><b>'+catalogoEsc(c)+'</b><em>'+catalogoProdutos.filter(p=>p.mostrar_catalogo&&String(p.categoria||'').trim()===c).length+'</em></button>').join('')+
 '<button class="catalogo-categoria '+(catalogoCategoria==='todos'?'ativo':'')+'" data-cat="todos"><span>▦</span><b>Todos os Produtos</b><em>'+catalogoProdutos.filter(p=>p.mostrar_catalogo).length+'</em></button>';
 e.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{catalogoCategoria=b.dataset.cat;catalogoCategoriasRender();catalogoProdutosRender()});
}
function catalogoCard(p){
 const qtd=Number(p.quantidade||0),off=qtd<=0,fav=catalogoFavoritos.includes(p.id),cat=String(p.categoria||'').trim();
 return '<article class="catalogo-card"><div class="catalogo-card-imagem">'+catalogoImg(p)+'<button class="catalogo-favorito '+(fav?'ativo':'')+'" data-fav="'+p.id+'" type="button">'+(fav?'♥':'♡')+'</button><span class="catalogo-estoque '+(off?'esgotado':'')+'"><i>'+(off?'×':'✓')+'</i> '+(off?'Esgotado':'Em estoque')+'</span></div><div class="catalogo-card-corpo"><h3>'+catalogoEsc(p.nome)+'</h3>'+(cat?'<span class="catalogo-categoria-tag">'+catalogoEsc(cat)+'</span>':'')+'<p>'+catalogoEsc(p.descricao||'Peça feita à mão com muito carinho.')+'</p><strong>'+(catalogoLoja.mostrar_preco!==false?catalogoMoney(p.preco):'')+'</strong><button class="catalogo-add" data-add="'+p.id+'" '+(off?'disabled':'')+'><span>🛒</span> '+(off?'Indisponível':'Adicionar ao carrinho')+'</button></div></article>'
}
function catalogoProdutosRender(){
 const grid=document.getElementById('catalogoGrid');if(!grid)return;
 const a=catalogoLista();document.getElementById('catalogoTotal').textContent=a.length;
 grid.innerHTML=a.length?a.map(catalogoCard).join(''):'<div class="catalogo-vazio"><span>🧶</span><h3>Nenhum produto encontrado</h3><p>Altere a busca ou os filtros.</p></div>';
 grid.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.add),p=catalogoProdutos.find(x=>Number(x.id)===id);if(!p)return;const i=catalogoCarrinho.find(x=>Number(x.id)===id);if(i)i.quantidade=Math.min(Number(p.quantidade),i.quantidade+1);else catalogoCarrinho.push({id,quantidade:1});catalogoSave();catalogoCount();catalogoToast('Produto adicionado ao carrinho.')});
 grid.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.fav);catalogoFavoritos=catalogoFavoritos.includes(id)?catalogoFavoritos.filter(x=>x!==id):[...catalogoFavoritos,id];catalogoFavSave();catalogoProdutosRender()})
}
function catalogoCarrinhoRender(){
 const e=document.getElementById('catalogoCarrinhoLista'),t=document.getElementById('catalogoCarrinhoTotal');if(!e)return;
 let total=0;
 if(!catalogoCarrinho.length){e.innerHTML='<div class="catalogo-carrinho-vazio"><span>🛒</span><h3>Seu carrinho está vazio</h3><p>Adicione produtos para montar seu pedido.</p></div>';if(t)t.textContent=catalogoMoney(0);return}
 e.innerHTML=catalogoCarrinho.map(i=>{const p=catalogoProdutos.find(x=>Number(x.id)===Number(i.id));if(!p)return'';const sub=Number(p.preco||0)*Number(i.quantidade);total+=sub;return '<div class="catalogo-carrinho-item"><div class="catalogo-carrinho-img">'+catalogoImg(p)+'</div><div class="catalogo-carrinho-info"><b>'+catalogoEsc(p.nome)+'</b><small>'+catalogoMoney(p.preco)+' cada</small></div><div class="catalogo-qtd"><button data-q="-1" data-id="'+p.id+'">−</button><span>'+i.quantidade+'</span><button data-q="1" data-id="'+p.id+'">+</button></div><strong>'+catalogoMoney(sub)+'</strong><button class="catalogo-remover" data-remove="'+p.id+'">×</button></div>'}).join('');
 if(t)t.textContent=catalogoMoney(total);
 e.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const i=catalogoCarrinho.find(x=>Number(x.id)===Number(b.dataset.id)),p=catalogoProdutos.find(x=>Number(x.id)===Number(b.dataset.id));if(!i||!p)return;i.quantidade+=Number(b.dataset.q);if(i.quantidade<=0)catalogoCarrinho=catalogoCarrinho.filter(x=>Number(x.id)!==Number(b.dataset.id));else i.quantidade=Math.min(i.quantidade,Number(p.quantidade));catalogoSave();catalogoCount();catalogoCarrinhoRender()});
 e.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{catalogoCarrinho=catalogoCarrinho.filter(x=>Number(x.id)!==Number(b.dataset.remove));catalogoSave();catalogoCount();catalogoCarrinhoRender()})
}
function catalogoAbrir(){catalogoCarrinhoRender();document.getElementById('catalogoCarrinhoModal')?.classList.add('aberto');document.body.classList.add('modal-aberto')}
function catalogoFechar(){document.getElementById('catalogoCarrinhoModal')?.classList.remove('aberto');document.body.classList.remove('modal-aberto')}
async function catalogoFinalizar(ev){
 ev.preventDefault();const fd=new FormData(ev.target),cliente=String(fd.get('cliente')||'').trim(),telefone=String(fd.get('telefone')||'').trim(),btn=ev.target.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Processando pedido...';
 const r=await supabaseClient.rpc('finalizar_pedido_catalogo',{p_slug:catalogoSlug,p_cliente:cliente,p_telefone:telefone,p_itens:catalogoCarrinho});
 if(r.error||!r.data?.sucesso){btn.disabled=false;btn.textContent='Confirmar pedido e enviar no WhatsApp';catalogoToast(r.error?.message||'Não foi possível concluir o pedido.',true);return}
 const linhas=(r.data.itens||[]).map(i=>'- '+i.nome+' x'+i.quantidade+' — '+catalogoMoney(i.valor)).join('\n'),txt='Olá! Quero confirmar meu pedido na sua loja.\n\nPedido #'+r.data.pedido_id+'\nCliente: '+cliente+'\nWhatsApp: '+telefone+'\n\n'+linhas+'\n\nTotal: '+catalogoMoney(r.data.total)+'\nStatus: Pendente',num=String(r.data.whatsapp||'').replace(/\D/g,'');
 catalogoCarrinho=[];catalogoSave();catalogoCount();catalogoFechar();catalogoToast('Pedido #'+r.data.pedido_id+' registrado! Abrindo o WhatsApp...');if(num)location.href='https://wa.me/'+num+'?text='+encodeURIComponent(txt);
}
function catalogoRender(){
 const root=document.getElementById('catalogoApp'),nome=catalogoLoja.catalogo_nome||catalogoLoja.nome||'Minha Loja',slogan=catalogoLoja.catalogo_slogan||'Peças feitas à mão com muito carinho, qualidade e o toque especial do crochê.',banner=catalogoLoja.catalogo_banner||'',prod=catalogoProdutos.filter(p=>p.mostrar_catalogo),max=Math.max(200,...prod.map(p=>Number(p.preco||0)));
 catalogoPrecoMax=max;document.documentElement.style.setProperty('--catalogo-cor',catalogoLoja.catalogo_cor||'#e85f12');document.documentElement.style.setProperty('--catalogo-botao',catalogoLoja.catalogo_cor_botao||'#e85f12');
 root.innerHTML='<header class="catalogo-topbar"><div class="catalogo-topbar-inner"><a class="catalogo-brand" href="/loja/index.html?slug='+encodeURIComponent(catalogoSlug)+'"><span class="catalogo-brand-icon">⌬</span><span><strong>Kroche Manager</strong><small>Organize • Crie • Conquiste</small></span></a><nav class="catalogo-nav"><a class="ativo" href="#inicio">⌂ <span>Início</span></a><button id="navCarrinho">🛒 <span>Meu Carrinho</span><b class="catalogo-carrinho-badge" id="contadorCarrinho">0</b></button><a href="#entrar">♙ <span>Entrar</span></a></nav><div class="catalogo-top-actions"><label class="catalogo-busca-top"><input id="catalogoBusca" type="search" placeholder="Buscar produtos..."><span>⌕</span></label><button class="catalogo-cart-icon" id="navCarrinho2">🛒<b class="catalogo-carrinho-badge">0</b></button></div></div></header><div class="catalogo-layout" id="inicio"><aside class="catalogo-filtros"><div class="catalogo-side-title">▦ <strong>Categorias</strong></div><div id="catalogoCategorias"></div><div class="catalogo-divider"></div><div class="catalogo-side-title">▽ <strong>Filtros</strong></div><div class="catalogo-filter-block"><b>Faixa de Preço</b><div class="catalogo-preco-label"><span>R$ 0,00</span><span id="catalogoPrecoLabel">'+catalogoMoney(max)+'</span></div><input id="catalogoPreco" class="catalogo-range" type="range" min="0" max="'+max+'" step="1" value="'+max+'"></div><div class="catalogo-filter-block"><b>Disponibilidade</b><label class="catalogo-switch"><input id="catalogoEstoque" type="checkbox"><span></span><em>Produtos em estoque</em></label></div><div class="catalogo-filter-block"><b>Ordenar por</b><select id="catalogoOrdenacao"><option value="recentes">Mais recentes</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option><option value="nome">Nome</option><option value="favoritos">Favoritos</option></select></div><div class="catalogo-seguro"><span>♢</span><div><strong>Compra segura</strong><small>Seus dados estão protegidos</small></div></div></aside><main class="catalogo-main"><section class="catalogo-hero"><div class="catalogo-hero-copy"><span class="catalogo-hero-label">BEM-VINDO AO NOSSO CATÁLOGO</span><h1>Artesanato que<br>encanta em cada detalhe</h1><p>'+catalogoEsc(slogan)+'</p><a href="#produtos" class="catalogo-cta">🛒 Ver todos os produtos</a></div><div class="catalogo-hero-image">'+(banner?'<img src="'+catalogoEsc(banner)+'" alt="Banner de '+catalogoEsc(nome)+'">':'<div class="catalogo-hero-placeholder"><span>🧶</span><b>Feito à mão</b></div>')+'</div></section><section class="catalogo-produtos-section" id="produtos"><div class="catalogo-section-head"><h2>★ <span>Produtos em destaque</span></h2><a href="#produtos">Ver todos os produtos →</a></div><div class="catalogo-count"><span id="catalogoTotal">0</span> produtos</div><div class="catalogo-grid" id="catalogoGrid"></div></section></main></div><div class="catalogo-toast" id="catalogoToast"></div><div class="catalogo-modal" id="catalogoCarrinhoModal"><div class="catalogo-modal-bg" id="fecharCarrinhoBg"></div><section class="catalogo-modal-box"><button class="catalogo-modal-close" id="fecharCarrinho" type="button">×</button><span class="catalogo-modal-label">SEU PEDIDO</span><h2>Meu Carrinho</h2><div id="catalogoCarrinhoLista"></div><div class="catalogo-total-box"><span>Total</span><strong id="catalogoCarrinhoTotal">R$ 0,00</strong></div><form id="catalogoForm"><label>Seu nome<input name="cliente" required maxlength="120" autocomplete="name" placeholder="Digite seu nome"></label><label>Seu WhatsApp<input name="telefone" required maxlength="30" autocomplete="tel" placeholder="(00) 00000-0000"></label><button class="catalogo-finalizar" type="submit">Confirmar pedido e enviar no WhatsApp</button><small>O pedido será registrado como pendente e o estoque será atualizado.</small></form></section></div>';
 catalogoCategoriasRender();catalogoProdutosRender();catalogoCount();
 document.getElementById('catalogoBusca').oninput=e=>{catalogoBusca=e.target.value.trim();catalogoProdutosRender()};
 document.getElementById('catalogoPreco').oninput=e=>{catalogoPrecoMax=Number(e.target.value);document.getElementById('catalogoPrecoLabel').textContent=catalogoMoney(catalogoPrecoMax);catalogoProdutosRender()};
 document.getElementById('catalogoEstoque').onchange=e=>{catalogoEstoque=e.target.checked;catalogoProdutosRender()};
 document.getElementById('catalogoOrdenacao').onchange=e=>{catalogoOrdenacao=e.target.value;catalogoProdutosRender()};
 document.getElementById('navCarrinho').onclick=catalogoAbrir;document.getElementById('navCarrinho2').onclick=catalogoAbrir;document.getElementById('fecharCarrinho').onclick=catalogoFechar;document.getElementById('fecharCarrinhoBg').onclick=catalogoFechar;document.getElementById('catalogoForm').onsubmit=catalogoFinalizar;
}
async function catalogoInicializar(){
 const root=document.getElementById('catalogoApp');if(!root)return;
 if(!catalogoSlug||['undefined','null'].includes(catalogoSlug)){root.innerHTML='<div class="catalogo-erro"><h2>Link do catálogo inválido</h2><p>O link precisa conter o identificador da loja.</p></div>';return}
 if(typeof supabaseClient==='undefined'){root.innerHTML='<div class="catalogo-erro"><h2>Não foi possível iniciar o catálogo</h2><p>A conexão com o catálogo não foi carregada.</p></div>';return}
 const r=await supabaseClient.rpc('obter_catalogo_publico',{p_slug:catalogoSlug});
 if(r.error||!r.data?.loja){root.innerHTML='<div class="catalogo-erro"><h2>Não foi possível carregar o catálogo</h2><p>'+catalogoEsc(r.error?.message||'Loja não encontrada.')+'</p><button onclick="location.reload()">Tentar novamente</button></div>';return}
 catalogoLoja=r.data.loja;catalogoProdutos=Array.isArray(r.data.produtos)?r.data.produtos:[];catalogoRender();
}
document.addEventListener('DOMContentLoaded',catalogoInicializar,{once:true});