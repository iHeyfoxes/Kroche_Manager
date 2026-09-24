/* initPerfil */
async function initPerfil(){
  layout();
  const p=await shell('Meu Perfil');
  const u=await user();
  if(!p||!u)return;

  document.getElementById('content').innerHTML=`<div class="grid grid-2">
    <div class="card">
      <h3>Dados da conta</h3>
      <p><b>Nome:</b> ${esc(p.nome)}</p>
      <p><b>E-mail:</b> ${esc(u.email)}</p>
      <form id="f">
        ${formField('Nova senha','senha','password','minlength="8"')}
        ${formField('Confirmar senha','confirmar','password','minlength="8"')}
        <div><label class="label">Foto de perfil</label><input class="input" type="file" name="foto" accept="image/png,image/jpeg,image/webp"><img id="perfilPreview" class="preview" style="display:none"></div>
        <button class="btn btn-primary" id="saveProfile">Salvar alterações</button>
      </form>
    </div>
    <div class="card">
      <img class="photo" src="${esc(p.foto||'')}" onerror="this.style.display='none'">
      <h3>${esc(p.nome)}</h3>
      <p class="muted">${esc(u.email)}</p>
      <hr>
      <h4>Aparência</h4>
      <p class="muted">Use o botão de tema no menu lateral para alternar entre modo claro e escuro.</p>
    </div>
  </div>
  <div class="card danger-zone">
    <span class="panel-kicker">ZONA DE PERIGO</span>
    <h3>Excluir minha conta</h3>
    <p class="muted">Essa ação remove sua conta de acesso e os dados vinculados. Ela não pode ser desfeita.</p>
    <button class="btn btn-danger" id="deleteAccount">Excluir minha conta</button>
  </div>`;

  const fi=document.querySelector('[name=foto]');
  document.getElementById('deleteAccount').onclick=async()=>{if(!confirm('Tem certeza que deseja excluir sua conta? Todos os dados associados serão removidos e essa ação não pode ser desfeita.'))return;const b=document.getElementById('deleteAccount');b.disabled=true;b.textContent='Excluindo conta...';try{const session=await supabaseClient.auth.getSession();const token=session.data.session?.access_token;if(!token)throw new Error('Sua sessão expirou. Faça login novamente.');const r=await fetch('https://tjmemwlavrsdclvtgtcs.supabase.co/functions/v1/excluir-conta',{method:'POST',headers:{Authorization:'Bearer '+token}});const body=await r.json().catch(()=>({}));if(!r.ok||!body.success)throw new Error(body.error||'Não foi possível excluir a conta.');await supabaseClient.auth.signOut();location.href='login.html'}catch(error){msg(error?.message||'Não foi possível excluir a conta.',false);b.disabled=false;b.textContent='Excluir minha conta'}};fi.onchange=()=>{
    const f=fi.files?.[0],img=document.getElementById('perfilPreview');
    if(!f)return;
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){
      msg('Imagem inválida. Use JPG, PNG ou WEBP de até 5 MB.',false);
      fi.value='';img.style.display='none';return;
    }
    img.src=URL.createObjectURL(f);img.style.display='block';
  };

  document.getElementById('f').onsubmit=async e=>{
    e.preventDefault();
    const btn=document.getElementById('saveProfile');
    btn.disabled=true;btn.textContent='Salvando...';
    try{
      const f=new FormData(e.target);
      if(f.get('senha')){
        if(f.get('senha')!==f.get('confirmar'))throw new Error('As senhas não coincidem.');
        const r=await supabaseClient.auth.updateUser({password:f.get('senha')});
        if(r.error)throw r.error;
      }
      let foto=p.foto;
      if(f.get('foto')?.size)foto=await upload('fotos-perfil',f.get('foto'),u.id);
      const {error}=await supabaseClient.from('usuarios').update({foto}).eq('id',u.id);
      if(error)throw error;
      msg('Perfil atualizado com sucesso!');
    }catch(x){msg(x.message,false)}
    finally{btn.disabled=false;btn.textContent='Salvar alterações'}
  };

  document.getElementById('deleteAccount').onclick=async()=>{
    const ok=confirm('Excluir sua conta definitivamente?\n\nTodos os dados vinculados e arquivos da conta serão removidos. Essa ação não pode ser desfeita.');
    if(!ok)return;
    const btn=document.getElementById('deleteAccount');
    btn.disabled=true;btn.textContent='Excluindo conta...';
    const r=await supabaseClient.functions.invoke('excluir-conta');
    if(r.error||!r.data?.success){
      btn.disabled=false;btn.textContent='Excluir minha conta';
      msg(r.data?.error||r.error?.message||'Não foi possível excluir a conta.',false);
      return;
    }
    await supabaseClient.auth.signOut();
    location.href='login.html';
  };
}