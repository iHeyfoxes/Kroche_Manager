/* ============================================================
   CORREÇÃO DO LINK DO CATÁLOGO PÚBLICO
   Evita links com slug=undefined quando o perfil em cache está antigo.
   ============================================================ */
(function () {
    async function corrigirLinksCatalogo() {
        if (!window.supabaseClient) return;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('slug')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data?.slug) return;

        const slug = encodeURIComponent(String(data.slug).trim());

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

    function iniciar() {
        corrigirLinksCatalogo();

        const observer = new MutationObserver(() => corrigirLinksCatalogo());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
