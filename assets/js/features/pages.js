/* Página e regras de negócio legadas, em migração gradual para módulos por domínio. */

window.addEventListener('error',e=>{console.error(e.error||e.message);const el=document.getElementById('content');if(el&&!el.innerHTML.trim())el.innerHTML='<div class="card error-state"><h2>Não foi possível carregar esta tela</h2><p class="muted">Ocorreu um erro ao carregar os dados. Atualize a página. Se continuar, abra o console do navegador e me envie o erro.</p><button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button></div>'});
window.addEventListener('unhandledrejection',e=>{console.error(e.reason);const el=document.getElementById('content');if(el&&!el.innerHTML.trim())el.innerHTML='<div class="card error-state"><h2>Erro ao carregar os dados</h2><p class="muted">Verifique sua conexão com o Supabase e tente novamente.</p><button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button></div>'});

