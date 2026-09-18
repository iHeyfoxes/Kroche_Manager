// ============================================================
// AUTENTICAÇÃO — Supabase Auth
// ============================================================

function mostrarAlerta(elId, tipo, mensagem) {
    const el = document.getElementById(elId);
    if (!el) return;

    el.className = `alerta ${tipo}`;
    el.textContent = mensagem;
    el.setAttribute("role", "alert");

    if (el._krocheAlertTimer) clearTimeout(el._krocheAlertTimer);
    el._krocheAlertTimer = setTimeout(() => {
        el.classList.add("oculto");
    }, tipo === "erro" ? 6000 : 4000);
}

function textoErroSupabase(error) {
    if (!error) return "Ocorreu um erro. Tente novamente.";
    const message = error.message || "";
    if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
    if (message.includes("already registered")) return "Este e-mail já está cadastrado.";
    return message;
}

async function fazerLogin(email, senha) {
    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(), password: senha
    });
    if (error) {
        mostrarAlerta("alerta", "erro", textoErroSupabase(error));
        return;
    }
    window.location.href = "dashboard.html";
}

async function fazerLoginGoogle() {
    const redirectTo = `${window.location.origin}/dashboard.html`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
    });

    if (error) {
        mostrarAlerta("alerta", "erro", textoErroSupabase(error));
    }
}

async function fazerCadastro({ nome, nicho, email, senha, confirmarSenha, termos, privacidade }) {
    if (senha !== confirmarSenha) {
        mostrarAlerta("alerta", "erro", "As senhas não coincidem.");
        return;
    }
    if (senha.length < 8) {
        mostrarAlerta("alerta", "erro", "A senha deve possuir pelo menos 8 caracteres.");
        return;
    }
    if (!nicho) {
        mostrarAlerta("alerta", "erro", "Selecione o nicho do seu ateliê.");
        return;
    }
    if (!termos || !privacidade) {
        mostrarAlerta("alerta", "erro", "Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
        return;
    }

    const { error } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
            data: {
                nome: nome.trim(),
                nicho: nicho,
                aceitou_termos: true,
                aceitou_politica: true
            }
        }
    });

    if (error) {
        mostrarAlerta("alerta", "erro", textoErroSupabase(error));
        return;
    }

    mostrarAlerta("alerta", "sucesso", "Conta criada com sucesso! Você já pode entrar.");
    setTimeout(() => (window.location.href = "login.html"), 1500);
}

async function pedirRecuperacaoSenha(email) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://krochemanager.com.br/reset-senha.html"
    });
    if (error) console.warn(error);
    mostrarAlerta("alerta", "info", "Se o e-mail existir, enviamos um link de recuperação.");
}

async function redefinirSenha(novaSenha, confirmarSenha) {
    if (novaSenha !== confirmarSenha) {
        mostrarAlerta("alerta", "erro", "As senhas não coincidem.");
        return;
    }
    if (novaSenha.length < 8) {
        mostrarAlerta("alerta", "erro", "A senha deve possuir pelo menos 8 caracteres.");
        return;
    }
    const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });
    if (error) {
        mostrarAlerta("alerta", "erro", textoErroSupabase(error));
        return;
    }
    mostrarAlerta("alerta", "sucesso", "Senha alterada com sucesso!");
    setTimeout(() => (window.location.href = "login.html"), 1500);
}

async function fazerLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

function closeMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("menuOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}

async function exigirLogin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return null;
    }
    return session.user;
}

(function carregarEstiloKroche() {
    const href = "assets/css/professional.css";
    if (document.querySelector(`link[data-kroche-style="${href}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.krocheStyle = href;
    document.head.appendChild(link);
})();
