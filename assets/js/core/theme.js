/* Tema claro/escuro */
function getSavedTheme(){return localStorage.getItem('kroche_theme')||'claro'}
function applyTheme(theme,persist=true){const t=theme==='escuro'?'escuro':'claro';document.documentElement.setAttribute('data-theme',t);document.body?.classList.toggle('dark',t==='escuro');if(persist)localStorage.setItem('kroche_theme',t)}
function renderThemeButton(theme){const b=document.getElementById('themeToggle');if(b)b.innerHTML=theme==='escuro'?'☀️ <span>Modo Claro</span>':'🌙 <span>Modo Escuro</span>'}
