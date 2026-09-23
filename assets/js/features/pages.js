/* Página e regras de negócio legadas, em migração gradual para módulos por domínio. */

const money = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function getSavedTheme(){return localStorage.getItem('kroche_theme')||'claro'}
function applyTheme(theme,persist=true){const t=theme==='escuro'?'escuro':'claro';document.documentElement.setAttribute('data-theme',t);document.body?.classList.toggle('dark',t==='escuro');if(persist)localStorage.setItem('kroche_theme',t)}
function renderThemeButton(theme){const b=document.getElementById('themeToggle');if(b)b.innerHTML=theme==='escuro'?'☀️ <span>Modo Claro</span>':'🌙 <span>Modo Escuro</span>'}
let _profileCache=null;
async function user(){const {data:{user},error}=await supabaseClient.auth.getUser();if(error||!user){location.href='login.html';return null}return user}
async function profile(){
  if(_profileCache)return _profileCache;
  const u=await user();if(!u)return null;
  const cacheKey='kroche_profile_'+u.id;
  try{const cached=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(cached){_profileCache=cached;return cached}}catch{}
  const {data,error}=await supabaseClient.from('usuarios').select('*').eq('id',u.id).maybeSingle();
  if(data){_profileCache=data;try{sessionStorage.setItem(cacheKey,JSON.stringify(data))}catch{};return data}
  // Fallback: a sessão válida não deve resultar em uma tela em branco se o perfil ainda não estiver disponível.
  console.warn('Perfil não encontrado:',error?.message||'sem registro');
  const fallback={id:u.id,nome:u.user_metadata?.nome||u.email?.split('@')[0]||'Usuário',tema:getSavedTheme(),_fallback:true};
  _profileCache=fallback;return fallback;
}
function toggleTheme(){const current=getSavedTheme();const next=current==='escuro'?'claro':'escuro';applyTheme(next);renderThemeButton(next);profile().then(p=>{if(p&&!p._fallback){p.tema=next;_profileCache=p;try{sessionStorage.setItem('kroche_profile_'+p.id,JSON.stringify(p))}catch{};supabaseClient.from('usuarios').update({tema:next}).eq('id',p.id).then(()=>{}).catch(()=>{})}})}
function nav(){const el=document.getElementById('appnav');if(!el)return;el.innerHTML=`
<a href="dashboard.html">🏠 <span>Dashboard</span></a><a href="produtos.html">🧶 <span>Produtos</span></a><a href="vendas.html">💰 <span>Vendas</span></a>
<a href="compras.html">🛒 <span>Compras</span></a><a href="receitas.html">📚 <span>Receitas</span></a><a href="encomendas.html">📦 <span>Encomendas</span></a>
<a href="leads.html">👥 <span>Clientes / Leads</span></a><a href="relatorios.html">📊 <span>Relatórios</span></a><a href="minha-loja.html">🏪 <span>Minha Loja</span></a>
<a href="calculadora.html">🧮 <span>Calculadora</span></a><a href="ajuda.html">❓ <span>Ajuda</span></a><a href="perfil.html">⚙️ <span>Meu Perfil</span></a><a href="#" id="logoutLink">🚪 <span>Sair</span></a>`;const active=location.pathname.split('/').pop();el.querySelectorAll('a[href]').forEach(a=>{if(a.getAttribute('href')===active)a.classList.add('active')});document.getElementById('logoutLink').onclick=e=>{e.preventDefault();fazerLogout()};el.querySelectorAll('a:not(#logoutLink)').forEach(a=>a.addEventListener('click',closeMenu))}
async function shell(title){
  const cachedTheme=getSavedTheme();applyTheme(cachedTheme,false);
  const p=await profile();if(!p){msg('Não foi possível carregar seu perfil. Recarregue a página.',false);return null}
  const theme=p.tema||cachedTheme;applyTheme(theme);
  const name=document.getElementById('userName');const titleEl=document.getElementById('pageTitle');
  if(name)name.textContent=p.nome||'Usuário';if(titleEl)titleEl.textContent=title;
  nav();renderThemeButton(theme);return p;
}
async function layout(){applyTheme(getSavedTheme(),false);document.body.innerHTML=`<div class="overlay-menu" id="menuOverlay"></div><div class="app"><aside class="sidebar" id="sidebar"><div class="brand"><span class="brand-icon">🧶</span><span>Kroche Manager</span></div><div class="sidebar-tools"><button class="btn btn-secondary" id="themeToggle" style="width:100%;">🌙 <span>Modo Escuro</span></button></div><nav class="nav" id="appnav"></nav></aside><main class="main"><div class="top"><div><div class="page-kicker">PAINEL DE CONTROLE</div><h1 id="pageTitle"></h1><span class="muted">Olá, <b id="userName"></b></span></div><button class="btn btn-secondary mobile-toggle" id="menuToggle">☰</button></div><div id="msg" hidden></div><div id="content"></div></main></div>`;applyTheme(getSavedTheme(),false);document.getElementById('menuToggle').onclick=()=>{document.getElementById('sidebar').classList.add('open');document.getElementById('menuOverlay').classList.add('open')};document.getElementById('menuOverlay').onclick=closeMenu;document.getElementById('themeToggle').onclick=toggleTheme}
function msg(text,ok=true){const el=document.getElementById('msg');if(el){el.className='alert '+(ok?'ok':'err');el.textContent=text;el.hidden=false;setTimeout(()=>el.hidden=true,3500)}}
async function upload(bucket,file,userId){if(!file)return null;const allowed=['image/jpeg','image/png','image/webp'];if(!allowed.includes(file.type))throw new Error('Escolha uma imagem JPG, PNG ou WEBP.');if(file.size>5*1024*1024)throw new Error('A imagem deve ter no máximo 5 MB.');const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`${userId}/${crypto.randomUUID()}.${ext}`;const {error}=await supabaseClient.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});if(error)throw new Error(`Não foi possível enviar a imagem: ${error.message}. Verifique as políticas do Storage no Supabase.`);const {data}=supabaseClient.storage.from(bucket).getPublicUrl(path);return data.publicUrl}
async function q(table,field){const u=await user();if(!u)return {data:null,error:{message:'Sem sessão'}};return supabaseClient.from(table).select('*').eq(field||'user_id',u.id)}
async function del(table,id,field){const u=await user();if(!u)return;const {error}=await supabaseClient.from(table).delete().eq('id',id).eq(field||'user_id',u.id);if(error)throw error}
function formField(label,name,type='text',extra=''){return `<div><label class="label">${label}</label><input class="input" name="${name}" type="${type}" ${extra}></div>`}















window.addEventListener('error',e=>{console.error(e.error||e.message);const el=document.getElementById('content');if(el&&!el.innerHTML.trim())el.innerHTML='<div class="card error-state"><h2>Não foi possível carregar esta tela</h2><p class="muted">Ocorreu um erro ao carregar os dados. Atualize a página. Se continuar, abra o console do navegador e me envie o erro.</p><button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button></div>'});
window.addEventListener('unhandledrejection',e=>{console.error(e.reason);const el=document.getElementById('content');if(el&&!el.innerHTML.trim())el.innerHTML='<div class="card error-state"><h2>Erro ao carregar os dados</h2><p class="muted">Verifique sua conexão com o Supabase e tente novamente.</p><button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button></div>'});

