(function(){
  'use strict';
  function apply(){
    if(document.body) document.body.classList.add('km-modern');
    document.documentElement.classList.add('km-modern');
    var style=document.getElementById('km-modern-runtime');
    if(!style){
      style=document.createElement('style');
      style.id='km-modern-runtime';
      style.textContent=`
        html.km-modern body{background:#f7f3ee!important;color:#302823!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important}
        html.km-modern .app{min-height:100vh!important;background:#f7f3ee!important}
        html.km-modern .sidebar{width:248px!important;padding:22px 15px!important;background:#fffdfb!important;border-right:1px solid #e9e0d7!important;box-shadow:8px 0 30px rgba(54,41,33,.05)!important}
        html.km-modern .main{margin-left:248px!important;min-height:100vh!important;padding:30px 38px 50px!important;background:#f7f3ee!important}
        html.km-modern .top{max-width:1460px!important;margin:0 auto 24px!important;padding:0 0 22px!important;border-bottom:1px solid #e9e0d7!important}
        html.km-modern .top h1{font-size:31px!important;line-height:1.1!important;font-weight:850!important;letter-spacing:-1px!important;color:#302823!important}
        html.km-modern #content{max-width:1460px!important;margin:0 auto!important}
        html.km-modern .dashboard-hero{position:relative!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;overflow:hidden!important;padding:31px 34px!important;border-radius:24px!important;border:1px solid #eaded3!important;background:linear-gradient(135deg,#fff 0%,#f8eee5 100%)!important;box-shadow:0 12px 34px rgba(66,48,38,.07)!important;margin-bottom:18px!important}
        html.km-modern .dashboard-hero h2{font-size:29px!important;line-height:1.14!important;letter-spacing:-.8px!important;color:#342923!important;margin:0 0 9px!important}
        html.km-modern .dashboard-hero p{color:#83756b!important;font-size:14px!important;margin:0!important}
        html.km-modern .dashboard-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin-bottom:18px!important}
        html.km-modern .metric-card{display:flex!important;align-items:center!important;gap:13px!important;min-height:116px!important;padding:20px!important;border-radius:18px!important;background:#fff!important;border:1px solid #e9e0d7!important;box-shadow:0 12px 34px rgba(66,48,38,.07)!important;color:#302823!important;text-decoration:none!important}
        html.km-modern .metric-card strong{display:block!important;font-size:23px!important;color:#302823!important}
        html.km-modern .metric-icon{width:46px!important;height:46px!important;display:grid!important;place-items:center!important;border-radius:14px!important;background:#f1e6dc!important;flex:0 0 46px!important}
        html.km-modern .dashboard-columns{display:grid!important;grid-template-columns:1.15fr .85fr!important;gap:18px!important;margin-bottom:18px!important}
        html.km-modern .card.dashboard-panel{background:#fff!important;border:1px solid #e9e0d7!important;border-radius:20px!important;box-shadow:0 12px 34px rgba(66,48,38,.07)!important;padding:24px!important}
        html.km-modern .quick-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important}
        html.km-modern .quick-card{display:flex!important;align-items:center!important;gap:12px!important;padding:16px!important;border-radius:15px!important;background:#fff!important;border:1px solid #e9e0d7!important;box-shadow:0 12px 34px rgba(66,48,38,.07)!important;color:#302823!important;text-decoration:none!important}
        html.km-modern .quick-card>span{width:38px!important;height:38px!important;display:grid!important;place-items:center!important;border-radius:11px!important;background:#f1e6dc!important;color:#6b4e3d!important}
        @media(max-width:900px){html.km-modern .dashboard-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}html.km-modern .dashboard-columns{grid-template-columns:1fr!important}html.km-modern .quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}html.km-modern .main{margin-left:0!important;padding:20px 16px 40px!important}}
        @media(max-width:560px){html.km-modern .dashboard-stats,html.km-modern .quick-grid{grid-template-columns:1fr!important}html.km-modern .dashboard-hero{display:block!important;padding:24px 20px!important}html.km-modern .main{padding:15px 11px 30px!important}}
      `;
      document.head.appendChild(style);
    }
  }
  apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();