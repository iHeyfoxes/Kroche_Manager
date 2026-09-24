/* Estrutura visual compartilhada do painel. */
function nav(){
  const el=document.getElementById('appnav');if(!el)return;
  const items=[
    ['Visão geral',[
      ['dashboard.html','⌂','Dashboard']
    ]],
    ['Operação',[
      ['vendas.html','↗','Vendas'],['compras.html','🛒','Compras'],['encomendas.html','▣','Encomendas'],
      ['estoque.html','▤','Estoque'],['receitas.html','▧','Receitas']
    ]],
    ['Relacionamento',[
      ['leads.html','♧','Leads']
    ]],
    ['Minha loja',[
      ['minha-loja.html','⌂','Minha Loja'],['relatorios.html','▥','Relatórios'],['calculadora.html','⌗','Calculadora']
    ]],
    ['Sistema',[
      ['ajuda.html','?','Ajuda'],['perfil.html','⚙','Meu Perfil']
    ]]
  ];
  el.innerHTML=items.map(([section,links])=>'<div class="nav-section-title">'+section+'</div>'+
    links.map(([href,icon,label])=>'<a href="'+href+'"><span class="nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span></a>').join('')
  ).join('')+
  '<a href="#" id="logoutLink" class="nav-logout"><span class="nav-icon" aria-hidden="true">↪</span><span>Sair</span></a>';

  const active=location.pathname.split('/').pop()||'dashboard.html';
  el.querySelectorAll('a[href]').forEach(a=>{
    if(a.getAttribute('href')===active)a.classList.add('active');
    a.addEventListener('click',closeMenu);
  });
  const logout=document.getElementById('logoutLink');
  if(logout)logout.onclick=e=>{e.preventDefault();fazerLogout()};
}

async function layout(){
  applyTheme(getSavedTheme(),false);
  document.body.innerHTML=`
    <div class="overlay-menu" id="menuOverlay"></div>
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-head"><div class="brand"><span class="brand-icon">🧶</span><span>Kroche <b>Manager</b></span></div><button class="sidebar-close" id="sidebarClose" aria-label="Fechar menu">×</button></div>
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
  document.getElementById('menuOverlay').onclick=closeMenu;document.getElementById('sidebarClose').onclick=closeMenu;
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