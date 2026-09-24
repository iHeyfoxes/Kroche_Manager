/* Tema claro/escuro — a preferência local é a fonte de verdade entre as telas. */
function getSavedTheme(){const saved=localStorage.getItem('kroche_theme');return saved==='escuro'?'escuro':'claro'}
function applyTheme(theme,persist=true){const t=theme==='escuro'?'escuro':'claro';document.documentElement.setAttribute('data-theme',t);document.body?.classList.toggle('dark',t==='escuro');if(persist)localStorage.setItem('kroche_theme',t)}
function renderThemeButton(theme){const b=document.getElementById('themeToggle');if(b)b.innerHTML=theme==='escuro'?'☀️ <span>Modo Claro</span>':'🌙 <span>Modo Escuro</span>'}
async function toggleTheme(){
  const next=getSavedTheme()==='escuro'?'claro':'escuro';
  applyTheme(next,true);
  renderThemeButton(next);
  try{
    const u=await user();
    if(!u)return;
    const {error}=await supabaseClient.from('usuarios').update({tema:next}).eq('id',u.id);
    if(error)console.warn('Não foi possível sincronizar o tema no perfil:',error.message);
    if(typeof _profileCache==='object'&&_profileCache)_profileCache.tema=next;
  }catch(error){console.warn('Não foi possível sincronizar o tema:',error?.message||error)}
}
