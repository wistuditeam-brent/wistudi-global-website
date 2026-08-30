(()=>{
  'use strict';
  if(window.__WISTUDI_RESOURCE_PAGE__) return;
  window.__WISTUDI_RESOURCE_PAGE__=true;

  const localeCodes=['en','vi','zh-cn','th','id','ms','ar'];
  const first=location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  const locale=localeCodes.includes(first)?first:'en';
  const intlLocale={en:'en',vi:'vi-VN','zh-cn':'zh-CN',th:'th-TH',id:'id-ID',ms:'ms-MY',ar:'ar'}[locale]||'en';
  const noteWords={en:['note','notes'],vi:['ghi chú','ghi chú'],'zh-cn':['篇','篇'],th:['รายการ','รายการ'],id:['catatan','catatan'],ms:['catatan','catatan'],ar:['ملاحظة','ملاحظات']}[locale]||['note','notes'];

  const ensureScript=src=>new Promise(resolve=>{
    const existing=[...document.scripts].find(s=>new URL(s.src||'',location.href).pathname===src);
    if(existing){resolve(existing);return;}
    const s=document.createElement('script');
    s.src=src;s.async=false;
    s.addEventListener('load',()=>resolve(s),{once:true});
    s.addEventListener('error',()=>resolve(null),{once:true});
    document.head.appendChild(s);
  });
  ensureScript('/assets/js/i18n.js').then(()=>ensureScript('/assets/js/resources-i18n.js'));

  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[ch]));
  const storageKey=()=>`wistudi.resources.lastSeen:${window.WISTUDI_VIEWER_ID||'anonymous'}`;
  const FALLBACK='/assets/images/resources/media-fallback.svg';
  const FB_ICON='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAHR0lEQVR42u2cW2wcZxXH/+f7vtn1bhJ3HScNddKGQmhLKmhQFaWJuCiEiieKimS30LtA0JvgoRIPVMgKPCLBm1Uk+hAkIjVGCF4AlbYvkBIkSOlLCupFkIomddw4vuxlLt85PMys7RCSzs66a2d9jjTah93V7P5/33duc2YIEAJIAODA1356kECjELke4BLUVsQERAQKQXSaPP/qT889+mL2DhEwbu4YHSxbt3GCjH3AGGcBgQAg1W6FAAgoU5M5EWF/xCf1x09MzoUOOMzGTjxTqgw+GDZmmTn2S3DUVsxIpK1ruVp7uNVgAzz1EO2/55lD1rkXhH0CiNWF34MNAfJkrPM+OmSIeNRYKwImFb9HewFMxlohYMwQ0Q6ICr86kZl2GAGMqrFqvsio+KtsCkABKAA1BbB+zakEQFrzE9q1P12cqVySusjyJoMogGJb3xAIBBZB4j28F3jPYFkSdQlICocofTWGQEQwRDCGFEAnZk0qeqMZI048SoHF5muqGLqmgq1DG7ChWkIpsAAA7xmeUzCtMEEzjNEMYzSaMaLYI4wSNFsxqIu2mVtPK55ZMLsQYqDscNst12H/nuvxqd0j2DlSw3CtmlvIOPFYaERoNGO89uYUfjDxErxnGCKIAvg/q94a1BsRgsDi7jt348uf3409H7/u0spU/sev0/J4sBQjAmcxNFjB0GAl/YzugMsHVyLChbkm9n5iB779wAF88uYPLb7vOW2CLffvy4W+QgsBzAJDQDOMNQZcKbOZr4d45Cu344n77kDg7KLoxhBswQC6HJohDcKXFWmhEeGpRz6D++/aA0i6aq1ZW43fvizErCHM1SM8+tV9uP+uPfA+vcRqzNrrupt+FH++HuHQ/o/im2N74VmyvF1bET3xO1HC2Fyr4rtf/+yyQKy9oB6tfoNGK8J9X7oN27ZsTFf/Gp8t6BsARIQoSjCydRB3f+FWiHSXnyuAjitdoNGKcXDfR1AbHIBImqd3ayLvf2gaCkAYCAKLz+29MRWmC8FZlmqFy20im71hrdYBICKEscfI1k3YvWtb2rEsMOghkg4RtsUVEbQiD2a+5LMsAkuEeiNSAERAknjs3D6ETRtKi0IWEb8ZJvjD8ddx4tW3cWZqDvVmhMRf6mskA58kHt4zqEAjrq92QOIZu24YzlYn0IlnaIv/1tvn8fRPnsepN6bSVoU171tDEBGcNet7B7RF3LZl45Ij78gFEerNGN/78fN47a0pbK5VwJxWz3mCrHQRiV2/iO+cxXCtuuSTcppnhjUGL7z8Bk69OYXhWgVxwpqGdpq5WEMYKHW+ntpj4ydP/Se9aCO9/e19VYiVMgCdOJ92g+7s9AKcNV25k3UOoHjPR0TQaEbp93UHrI4L814Kp5IK4GpuoagECkABqCkABaCmANalreleUHtUMG8x1d255KIjb/VH/QbAmLQn/7EbhvH0Ywfz6YD0AsmHtw9d1F7o5Jw//M6daIUJjMlXjDELnCVMHD2Bl185jQ3VErhAI2lN7gBmQXUgwK27ru3ZOXftHC70PZ+1rfvOBbHIYk8+73omU9wlcAcXktu/qRnGOHe+njXx+jAGtN1BL4ZLDFHuE7WvoNUbEc7PNuGcKTweoVlQkYCdvZ6fbaLeiGBN8SaeAiicnQFnzs0j8YxuciEF0AWBs9MLiBMPMgqgt5bp/e70fNeTcQqgaMAGcHZ6HrbLy5gKoMgGoKXryN3ecaMACgbgRivGzGwz2wEKoIcpaKr2ezMNLDTCbDi3Dwez0gvlnLsQE6Q3aBSdjPDM6T0FOVoP1hCmL9QxX49QLrn+m4wTAZw1sLZ3G9TmfHiYTZ9igPl6iDBKUCk7+C5ckFuL4gfO4NzMAn7+65P5dgARvGd88dM3YeTaTdndMZ2d8zcvnsLMXOrTr+TUWQBDwKv/OJut/u7+7xoEICgFBu9OL+BHz/4xd1YSxgluvnFrBqCz8XQRwbO//Cv++a9pDOR0KeWSQ2XApU28fgKw6IKcweb2sG0OAHGcIAiKu6zaYAVbalWUcgKQrFvbra35IJwXQOK5K3fgPSPxDOu5p/OhmoaudlWtEigABaCmABSAmgJQAGoKQAGoKQAFoKYAFICaAlAAagpAAagpAAWgpgAUgJoCUABqCkABqCkABaC2ogCkhZ4/LVMt1VxaBqC/g0CKoLfSg4iI8YoR8kd8HF6w1hkRJKrOB6y9ILE2sEncugC2R8yfjz75bzA9QTYgF5RdRoivygPCAFgkfc17iAhLT34f4IKyI+vAXp48Pvmt02509JidfG7s6L57JmYCV/4+yOw11l5Vj7UnIhghlMsVAOj45j5rDVxQgnEBjHMf2A0a7JOE2Z/kOD584thjvx0dPWbd5OSYx/i4+cvhx38H4PcH7v3Z7R5+O7EvkzEizHQ1QGAReefM9KbBqgmYIaYDBsxAFDfnxCfex35F/29bQ2uDloi8c/wX3/gbAMH4uJk8POb/C9s/vz4zSZeEAAAAAElFTkSuQmCC';
  const DISCORD_ICON='data:image/png;base64,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';

  function ensureStylesheet(href){
    if(document.querySelector(`link[href="${href}"]`)) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }

  function ensureResourceStyles(){
    ensureStylesheet('/assets/css/resources-site.css');
    ensureStylesheet('/assets/css/resources-image-integrity.css');
  }

  function initFooterSocials(){
    if(!document.getElementById('ws-footer-social-style')){
      const style=document.createElement('style');style.id='ws-footer-social-style';style.textContent='.ws-footer-socials{display:flex;align-items:center;gap:10px;margin-top:12px}.ws-footer-social{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;border:1px solid #e2dceb;background:#fff;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.ws-footer-social:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(34,24,64,.08);border-color:#cfc6df}.ws-footer-social img{display:block;width:26px;height:26px;object-fit:contain}.ws-footer-social.discord img{width:28px;height:28px}';document.head.appendChild(style);
    }
    document.querySelectorAll('.ws-site-footer').forEach(footer=>{
      if(footer.querySelector('.ws-footer-socials'))return;
      const host=footer.querySelector('.ws-footer-contact')||footer.querySelector('.ws-footer-row')||footer;
      const wrap=document.createElement('div');wrap.className='ws-footer-socials';
      const discord=document.createElement('a');discord.className='ws-footer-social discord';discord.href='https://discord.com/widget?id=1543642413627605065&theme=dark';discord.target='_blank';discord.rel='noopener noreferrer';discord.setAttribute('aria-label','Wistudi on Discord');discord.title='Wistudi on Discord';discord.innerHTML=`<img src="${DISCORD_ICON}" alt="">`;
      const facebook=document.createElement('a');facebook.className='ws-footer-social facebook';facebook.href='https://www.facebook.com/profile.php?id=61590336100890';facebook.target='_blank';facebook.rel='noopener noreferrer';facebook.setAttribute('aria-label','Wistudi on Facebook');facebook.title='Wistudi on Facebook';facebook.innerHTML=`<img src="${FB_ICON}" alt="">`;
      wrap.append(discord,facebook);host.appendChild(wrap);
    });
  }

  function markSeen(){
    try{localStorage.setItem(storageKey(),new Date().toISOString())}catch(_){ }
    document.querySelectorAll('.ws-resource-badge').forEach(b=>{b.hidden=true;b.textContent='';});
  }

  function initImageFallbacks(){
    const apply=img=>{
      if(!img || img.dataset.wsFallback==='1' || img.src.endsWith('/media-fallback.svg')) return;
      img.dataset.wsOriginalSrc=img.currentSrc||img.src||'';
      img.dataset.wsFallback='1';
      img.src=FALLBACK;
      img.alt='Wistudi image temporarily unavailable';
      img.classList.add('res-image-fallback');
    };
    document.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error',()=>apply(img),{once:true});
      if(img.complete && img.naturalWidth===0) apply(img);
    });
  }

  function initHeader(){
    const mobile=document.querySelector('.ws-mobile-menu');
    const toggle=document.querySelector('.ws-menu-toggle');
    if(toggle&&mobile){
      toggle.addEventListener('click',()=>{
        const open=mobile.classList.toggle('open');
        toggle.setAttribute('aria-expanded',String(open));
      });
    }
    document.querySelectorAll('.ws-lang').forEach(lang=>{
      const button=lang.querySelector('.ws-lang-toggle');
      if(!button)return;
      button.addEventListener('click',e=>{
        e.stopPropagation();
        const open=!lang.classList.contains('open');
        document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));
        lang.classList.toggle('open',open);
        button.setAttribute('aria-expanded',String(open));
      });
    });
    document.addEventListener('click',()=>document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open')));
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));
      mobile?.classList.remove('open');
      toggle?.setAttribute('aria-expanded','false');
    });
  }

  function initLightbox(){
    const box=document.querySelector('.res-lightbox');
    if(!box)return;
    const image=box.querySelector('img');
    const close=()=>{box.classList.remove('open');document.body.style.overflow='';};
    document.querySelectorAll('[data-res-lightbox]').forEach(button=>button.addEventListener('click',()=>{
      if(image){image.src=button.dataset.full||button.querySelector('img')?.dataset.wsOriginalSrc||button.querySelector('img')?.src||'';image.alt=button.querySelector('img')?.alt||'';}
      box.classList.add('open');document.body.style.overflow='hidden';
    }));
    box.querySelector('.res-lightbox-close')?.addEventListener('click',close);
    box.addEventListener('click',e=>{if(e.target===box)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('open'))close();});
  }

  async function initArchive(){
    const root=document.querySelector('[data-res-archive]');
    if(!root)return;
    const list=root.querySelector('[data-res-list]');
    const search=root.querySelector('[data-res-search]');
    const topic=root.querySelector('[data-res-topic]');
    const type=root.querySelector('[data-res-type]');
    const sort=root.querySelector('[data-res-sort]');
    const count=root.querySelector('[data-res-count]');
    const empty=root.querySelector('[data-res-empty]');
    if(!list)return;

    let articles=[];
    try{
      const response=await fetch('/assets/data/resources-manifest.json',{cache:'force-cache'});
      if(response.ok){
        const data=await response.json();
        articles=(Array.isArray(data?.articles)?data.articles:[]).filter(a=>a.status==='published'&&a.locales?.en?.url);
      }
    }catch(_){ }

    if(!articles.length){if(count&&count.textContent.includes('Loading'))count.textContent='No notes available';return;}
    const formatDate=value=>{try{return new Intl.DateTimeFormat(intlLocale,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}catch(_){return '';}};
    const localizedUrl=url=>locale==='en'?url:`/${locale}${url.startsWith('/')?url:'/'+url}`;
    const makeCard=a=>{const l=a.locales.en;return `<a class="res-list-card" href="${localizedUrl(l.url)}"><div class="res-list-image"><img src="${a.heroImage}" alt="${escapeHtml(a.heroAlt||l.title)}" loading="lazy" decoding="async"></div><div><div class="res-type">${escapeHtml(a.type)}</div><h2>${escapeHtml(l.title)}</h2><p>${escapeHtml(l.excerpt)}</p><div class="res-card-meta"><span>${escapeHtml((a.topics||[]).slice(0,3).join(' · '))}</span><span data-ws-resource-date="${escapeHtml(a.publishedAt)}">${formatDate(a.publishedAt)}</span></div></div><span class="res-list-arrow" aria-hidden="true">→</span></a>`;};
    const initial=new URLSearchParams(location.search).get('q')||'';
    if(search)search.value=initial;
    const apply=()=>{
      const q=(search?.value||'').trim().toLowerCase(); const topicValue=topic?.value||'all'; const typeValue=type?.value||'all'; const sortValue=sort?.value||'newest';
      let filtered=articles.filter(a=>{const l=a.locales.en;const hay=[l.title,l.excerpt,a.type,...(a.topics||[])].join(' ').toLowerCase();return(!q||hay.includes(q))&&(topicValue==='all'||(a.topics||[]).includes(topicValue))&&(typeValue==='all'||a.type===typeValue);});
      filtered.sort((a,b)=>sortValue==='oldest'?new Date(a.publishedAt)-new Date(b.publishedAt):new Date(b.publishedAt)-new Date(a.publishedAt));
      list.innerHTML=filtered.map(makeCard).join('');
      initImageFallbacks();
      if(count)count.textContent=`${filtered.length} ${filtered.length===1?noteWords[0]:noteWords[1]}`;
      empty?.classList.toggle('show',filtered.length===0);
      window.__WISTUDI_RESOURCES_TRANSLATE_NODE__?.(list);
    };
    search?.addEventListener('input',apply,{passive:true}); topic?.addEventListener('change',apply); type?.addEventListener('change',apply); sort?.addEventListener('change',apply); apply();
  }

  ready(()=>{ensureResourceStyles();markSeen();initImageFallbacks();initHeader();initLightbox();initArchive();initFooterSocials();});
})();
