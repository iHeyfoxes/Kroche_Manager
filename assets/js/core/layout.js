/* Estrutura visual compartilhada do painel. */
function nav(){
  const el=document.getElementById('appnav');if(!el)return;
  el.innerHTML=`
    <div class="nav-section-title">Visão geral</div>
    <a href="dashboard.html">⌂ <span>Dashboard</span></a>
    <div class="nav-section-title">Operação</div>
    <a href="vendas.html">↗ <span>Vendas</span></a>
    <a href="compras.html">🛒 <span>Compras</span></a>
    <a href="encomendas.html">▣ <span>Encomendas</span></a>
    <a href="estoque.html">▤ <span>Estoque</span></a>
    <a href="receitas.html">▧ <span>Receitas</span></a>
    <div class="nav-section-title">Relacionamento</div>
    <a href="leads.html">♧ <span>Leads</span></a>
    <div class="nav-section-title">Minha loja</div>
    <a href="minha-loja.html">⌂ <span>Minha Loja</span></a>
    <a href="relatorios.html">▥ <span>Relatórios</span></a>
    <a href="calculadora.html">⌗ <span>Calculadora</span></a>
    <div class="nav-section-title">Sistema</div>
    <a href="ajuda.html">? <span>Ajuda</span></a>
    <a href="perfil.html">⚙ <span>Meu Perfil</span></a>
    <a href="#" id="logoutLink">↪ <span>Sair</span></a>`;
  const active=location.pathname.split('/').pop();
  el.querySelectorAll('a[href]').forEach(a=>{if(a.getAttribute('href')===active)a.classList.add('active')});
  document.getElementById('logoutLink').onclick=e=>{e.preventDefault();fazerLogout()};
  el.querySelectorAll('a:not(#logoutLink)').forEach(a=>a.addEventListener('click',closeMenu));
}
async function layout(){
  applyTheme(getSavedTheme(),false);
  document.body.innerHTML=`
    <div class="overlay-menu" id="menuOverlay"></div>
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><span class="brand-icon">🧶</span><span>Kroche <b>Manager</b></span></div>
        <div class="sidebar-caption">GESTÃO DO ATELIÊ</div>
        <div class="sidebar-tools"><button class="btn btn-secondary" id="themeToggle" style="width:100%;">◐ <span>Modo Escuro</span></button></div>
        <nav class="nav" id="appnav"></nav>
        <div class="sidebar-footer">Kroche Manager · 2026</div>
      </aside>
      <main class="main">
        <div class="top">
          <div><div class="page-kicker">PAINEL DE CONTROLE</div><h1 id="pageTitle"></h1><span class="muted">Olá, <b id="userName"></b></span></div>
          <button class="btn btn-secondary mobile-toggle" id="menuToggle">☰</button>
        </div>
        <div id="msg" hidden></div><div id="content"></div>
      </main>
    </div>`;
  document.getElementById('menuToggle').onclick=()=>{document.getElementById('sidebar').classList.add('open');document.getElementById('menuOverlay').classList.add('open')};
  document.getElementById('menuOverlay').onclick=closeMenu;
  document.getElementById('themeToggle').onclick=toggleTheme;
}
async function shell(title){
  const cachedTheme=getSavedTheme();applyTheme(cachedTheme,false);
  const p=await profile();if(!p){msg('Não foi possível carregar seu perfil. Recarregue a página.',false);return null}
  const theme=p.tema||cachedTheme;applyTheme(theme);
  const name=document.getElementById('userName'),titleEl=document.getElementById('pageTitle');
  if(name)name.textContent=p.nome||'Usuário';if(titleEl)titleEl.textContent=title;
  nav();renderThemeButton(theme);return p;
}