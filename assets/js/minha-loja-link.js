/* Corrige o link público da loja depois que a tela Minha Loja termina de renderizar. */
(async function () {
    async function obterSlug() {
        if (typeof supabaseClient === 'undefined' || !supabaseClient) return null;

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return null;

        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('slug')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data?.slug) return null;

        const slug = String(data.slug).trim();
        return slug && slug !== 'undefined' && slug !== 'null' ? slug : null;
    }

    async function corrigir() {
        const link = document.querySelector('a[href*="loja/index.html"]');
        if (!link) return false;

        const slug = await obterSlug();
        if (!slug) return false;

        const url = new URL(link.getAttribute('href') || 'loja/index.html', window.location.href);
        url.pathname = url.pathname.replace(/\/+/g, '/');
        url.searchParams.set('slug', slug);
        link.href = url.pathname + url.search + url.hash;
        link.dataset.slugCorrigido = 'true';
        return true;
    }

    // A tela é renderizada assincronamente pelo app.js. Tenta algumas vezes
    // para garantir que o botão já exista antes de corrigir o href.
    let tentativas = 0;
    const timer = setInterval(async () => {
        tentativas += 1;
        const ok = await corrigir();
        if (ok || tentativas >= 20) clearInterval(timer);
    }, 300);
})();
