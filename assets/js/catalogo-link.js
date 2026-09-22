/* ============================================================
   LINK DO CATÁLOGO PÚBLICO
   Garante que o link use o slug atual salvo no Supabase,
   mesmo quando o perfil em cache estiver desatualizado.
   ============================================================ */
(function () {
    let slugAtual = null;

    async function obterSlugAtual() {
        if (!window.supabaseClient) return null;

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return null;

        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('slug')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data?.slug) return null;

        const slug = String(data.slug).trim();
        if (!slug || slug === 'undefined' || slug === 'null') return null;

        slugAtual = slug;
        return slug;
    }

    function atualizarLink(link, slug) {
        if (!link || !slug) return;

        try {
            const url = new URL(link.getAttribute('href') || '', window.location.href);
            if (!url.pathname.includes('/loja/index.html')) return;
            url.searchParams.set('slug', slug);
            link.setAttribute('href', url.pathname + url.search + url.hash);
        } catch (e) {
            // Ignora links inválidos sem interromper a página.
        }
    }

    async function corrigirLinks() {
        const slug = slugAtual || await obterSlugAtual();
        if (!slug) return;

        document.querySelectorAll('a[href*="/loja/index.html"]').forEach(link => {
            atualizarLink(link, slug);
        });
    }

    async function iniciar() {
        await corrigirLinks();

        // Corrige links criados depois do carregamento da página.
        const observer = new MutationObserver(() => corrigirLinks());
        observer.observe(document.body, { childList: true, subtree: true });

        // Proteção extra: no clique, consulta o slug atual antes de navegar.
        document.addEventListener('click', async (event) => {
            const link = event.target.closest?.('a[href*="/loja/index.html"]');
            if (!link) return;

            event.preventDefault();

            const slug = await obterSlugAtual();
            if (!slug) {
                alert('Não foi possível identificar o catálogo desta loja. Atualize a página e tente novamente.');
                return;
            }

            atualizarLink(link, slug);
            window.location.href = link.href;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
