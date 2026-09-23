/* Compatibilidade de autenticação usada pelas telas internas. */
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

function closeMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("menuOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}

