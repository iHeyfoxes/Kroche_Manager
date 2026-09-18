/* Navegação complementar do Kroche Manager. Mantém Clientes e Materiais acessíveis em todas as telas. */
(function () {
  'use strict';
  function enhance() {
    const nav = document.getElementById('appnav');
    if (!nav || nav.dataset.enhanced === '1') return;
    const links = [
      ['clientes.html', '🧑‍🤝‍🧑', 'Clientes'],
      ['materiais.html', '🧵', 'Materiais e Estoque']
    ];
    links.forEach(([href, icon, label]) => {
      if (!nav.querySelector(`a[href="${href}"]`)) {
        const a = document.createElement('a');
        a.href = href;
        a.innerHTML = `${icon} <span>${label}</span>`;
        nav.appendChild(a);
      }
    });
    const active = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a[href]').forEach(a => {
      if (a.getAttribute('href') === active) a.classList.add('active');
    });
    nav.dataset.enhanced = '1';
  }
  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', enhance);
})();
