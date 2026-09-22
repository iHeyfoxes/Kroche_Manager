/* ============================================================
   CORREÇÃO DO LINK DO CATÁLOGO PÚBLICO
   Evita links com slug=undefined quando o perfil em cache está antigo.
   ============================================================ */
(function () {
    let slug = null;

    function corrigirLinks() {
        if (!slug) return;

        document.querySelectorAll('a[href]').forEach((link) => {
            const href = link.getAttribute('href') || '';
            if (!href.includes('/loja/index.html')) return;

            try {
                const url = new URL(href, window.location.href);
                const valor = url.searchParams.get('slug');
                if (!valor || valor === 'undefined' || valor === 'null') {
                    url.searchParams.set('slug', slug);
                    link.setAttribute('href', url.pathname + url.search + url.hash);
                }
            } catch (e) {
                // Ignora links inválidos sem interromper o restante da página.
            }
        });
    }

    async function iniciar() {
        if (!window.supabaseClient) return;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('slug')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data?.slug) return;
        slug = String(data.slug).trim();
        corrigirLinks();

        const observer = new MutationObserver(corrigirLinks);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
