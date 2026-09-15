(()=>{
  'use strict';
  const DISCORD_URL='https://discord.gg/ehnSMW6cD';
  const FACEBOOK_URL='https://www.facebook.com/profile.php?id=61590336100890';

  function normalizeResourcesFooter(){
    if(!document.body?.classList.contains('page-resources')) return;
    document.querySelectorAll('footer.ws-site-footer').forEach(footer=>{
      footer.innerHTML=`<div class="ws-container ws-footer-row">
        <a class="ws-brand" href="/" aria-label="Wistudi — Platform home"><img class="ws-footer-wordmark" src="/assets/images/wistudi-logo.png" alt="Wistudi"></a>
        <div class="ws-footer-links"><a href="/">Platform</a><a href="/blocks-activities/">Blocks &amp; Activities</a><a href="/organisations/">Organisations</a><a href="/resources/">Resources</a><a href="/contact/">Contact</a></div>
        <div class="ws-footer-contact"><a href="mailto:support@wistudi.com">support@wistudi.com</a><a href="mailto:partnerships@wistudi.com">partnerships@wistudi.com</a><a href="tel:+84879876624">+84 879 876 624</a><span>Operating out of Vietnam</span><span>85 Great Portland Street, First Floor, London, England</span></div>
        <div class="ws-footer-copy">© 2026 Wistudi</div>
      </div>`;
    });
  }

  function fixSocialLinks(){
    document.querySelectorAll('.ws-footer-social.discord, .ws-footer-discord').forEach(a=>{
      a.href=DISCORD_URL;a.target='_blank';a.rel='noopener noreferrer';
      a.setAttribute('aria-label','Join Wistudi on Discord');a.title='Join Wistudi on Discord';
    });
    document.querySelectorAll('.ws-footer-social.facebook').forEach(a=>{
      a.href=FACEBOOK_URL;a.target='_blank';a.rel='noopener noreferrer';
      a.setAttribute('aria-label','Wistudi on Facebook');a.title='Wistudi on Facebook';
    });
  }

  function init(){
    normalizeResourcesFooter();
    fixSocialLinks();
    const observer=new MutationObserver(()=>fixSocialLinks());
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),5000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
