/* Garante que o visual moderno continue sendo a folha de estilo final. */
(function manterModernComoUltimoEstilo() {
    const MODERN_FILE = 'assets/css/modern.css';
    const MODERN_URL = `${MODERN_FILE}?v=20260922-2`;

    function isModern(link) {
        const href = link?.getAttribute?.('href') || '';
        return href.split('?')[0].replace(/^\.\//, '').endsWith(MODERN_FILE);
    }

    function garantir() {
        const links = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
        let modern = links.find(isModern);

        if (!modern) {
            modern = document.createElement('link');
            modern.rel = 'stylesheet';
            modern.href = MODERN_URL;
            modern.dataset.krocheModern = 'true';
            document.head.appendChild(modern);
            return;
        }

        links.filter(link => link !== modern && isModern(link)).forEach(link => link.remove());

        const styles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
        if (styles[styles.length - 1] !== modern) document.head.appendChild(modern);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', garantir, { once: true });
    } else {
        garantir();
    }

    const observer = new MutationObserver(() => {
        const styles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
        const modern = styles.find(isModern);
        if (modern && styles[styles.length - 1] !== modern) garantir();
    });
    observer.observe(document.head, { childList: true });
})();
