/* Tema claro/escuro compartilhado do painel. */
function getSavedTheme(){return localStorage.getItem('kroche_theme')||'claro'}

function applyTheme(theme,persist=true){
  const t=theme==='escuro'?'escuro':'claro';
  document.documentElement.setAttribute('data-theme',t);
  document.body?.classList.toggle('dark',t==='escuro');
  if(persist)try{localStorage.setItem('kroche_theme',t)}catch{}
}

function renderThemeButton(theme){
  const b=document.getElementById('themeToggle');
  if(!b)return;
  const escuro=theme==='escuro';
  b.innerHTML=escuro
    ? '<span class="theme-icon" aria-hidden="true">☀️</span><span>Modo claro</span>'
    : '<span class="theme-icon" aria-hidden="true">🌙</span><span>Modo escuro</span>';
  b.setAttribute('aria-label',escuro?'Ativar modo claro':'Ativar modo escuro');
  b.setAttribute('aria-pressed',escuro?'true':'false');
}

function toggleTheme(){
  const next=getSavedTheme()==='escuro'?'claro':'escuro';
  applyTheme(next,true);
  renderThemeButton(next);
  if(typeof user==='function'&&typeof supabaseClient!=='undefined'){
    user().then(u=>{
      if(!u)return;
      supabaseClient.from('usuarios').update({tema:next}).eq('id',u.id)
        .then(({error})=>{if(error)console.warn('Não foi possível salvar o tema:',error.message)})
        .catch(error=>console.warn('Não foi possível salvar o tema:',error));
    }).catch(()=>{});
  }
}