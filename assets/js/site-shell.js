(()=>{
  const onReady=(fn)=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  onReady(()=>{
    const SUPPORTED={
      en:{code:'EN',label:'English',lang:'en',flag:'/assets/images/flags/en.svg'},
      vi:{code:'VI',label:'Tiếng Việt',lang:'vi',flag:'/assets/images/flags/vi.svg'},
      th:{code:'TH',label:'ไทย',lang:'th',flag:'/assets/images/flags/th.svg',font:'thai'},
      id:{code:'ID',label:'Bahasa Indonesia',lang:'id',flag:'/assets/images/flags/id.svg'},
      ms:{code:'MS',label:'Bahasa Melayu',lang:'ms',flag:'/assets/images/flags/ms.svg'},
      zh:{code:'ZH',label:'简体中文',lang:'zh-CN',flag:'/assets/images/flags/zh.svg',font:'chinese'}
    };
    const pathParts=location.pathname.split('/').filter(Boolean);
    const pathLocale=SUPPORTED[pathParts[0]]?pathParts[0]:null;
    const locale=(window.__WS_LOCALE__&&SUPPORTED[window.__WS_LOCALE__])?window.__WS_LOCALE__:pathLocale||'en';
    const localeInfo=SUPPORTED[locale];
    const translations=window.__WS_I18N__||{};
    document.documentElement.lang=localeInfo.lang;
    document.documentElement.dataset.wsLocale=locale;

    // Locale-specific typefaces while retaining Wistudi's existing typography elsewhere.
    if(localeInfo.font==='thai'){
      document.documentElement.classList.add('ws-font-thai');
      if(!document.getElementById('ws-locale-font')){
        const link=document.createElement('link');link.id='ws-locale-font';link.rel='stylesheet';link.href='https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap';document.head.appendChild(link);
      }
    }else if(localeInfo.font==='chinese'){
      document.documentElement.classList.add('ws-font-chinese');
      if(!document.getElementById('ws-locale-font')){
        const link=document.createElement('link');link.id='ws-locale-font';link.rel='stylesheet';link.href='https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap';document.head.appendChild(link);
      }
    }

    const normalise=s=>String(s||'').replace(/\s+/g,' ').trim();
    const lookup=s=>translations[normalise(s)]||null;
    const skipTextNode=node=>{
      const p=node.parentElement;
      return !p||!!p.closest('script,style,noscript,svg,code,pre');
    };
    const translateTextNode=node=>{
      if(skipTextNode(node))return;
      const source=node.nodeValue||'';
      const key=normalise(source);
      if(!key)return;
      const translated=translations[key];
      if(!translated||translated===key)return;
      const leading=source.match(/^\s*/)?.[0]||'';
      const trailing=source.match(/\s*$/)?.[0]||'';
      node.nodeValue=leading+translated+trailing;
    };
    const translateElement=el=>{
      if(!(el instanceof Element)||el.matches('script,style,noscript,svg,code,pre'))return;
      ['placeholder','aria-label','title','alt'].forEach(attr=>{
        if(!el.hasAttribute(attr))return;
        const value=el.getAttribute(attr);const translated=lookup(value);
        if(translated&&translated!==value)el.setAttribute(attr,translated);
      });
      [...el.childNodes].forEach(child=>{
        if(child.nodeType===Node.TEXT_NODE)translateTextNode(child);
        else if(child.nodeType===Node.ELEMENT_NODE)translateElement(child);
      });
    };
    const translateDocument=()=>{
      if(locale==='en')return;
      const titleTranslation=lookup(document.title);if(titleTranslation)document.title=titleTranslation;
      document.querySelectorAll('meta[name="description"]').forEach(meta=>{const t=lookup(meta.content);if(t)meta.content=t;});
      if(document.body)translateElement(document.body);
    };

    const pageKey=window.__WS_PAGE__||(
      document.body.classList.contains('page-blocks')?'blocks':
      document.body.classList.contains('page-organisations')?'organisations':
      document.body.classList.contains('page-contact')?'contact':'platform'
    );
    const pageSuffix={platform:'/',blocks:'/blocks-activities/',organisations:'/organisations/',contact:'/contact/'}[pageKey]||'/';
    const localePath=(code,suffix=pageSuffix)=>`/${code}${suffix}`;
    const cookieLocale=code=>{document.cookie=`wistudi_locale=${encodeURIComponent(code)}; Max-Age=31536000; Path=/; SameSite=Lax`;};

    // All publishing CTAs go directly to the Wistudi sign-up page. Mark them before translation
    // so localized button text cannot interfere with the routing guarantee.
    const SIGNUP_URL='https://wistudi.com/sign-up';
    const syncPublishingLinks=()=>{
      document.querySelectorAll('a').forEach(a=>{
        const text=a.textContent.trim().toLowerCase();
        if(text==='start publishing'||a.dataset.wsPublish==='1'){
          a.dataset.wsPublish='1';a.href=SIGNUP_URL;
        }
      });
    };
    syncPublishingLinks();

    // Keep all Wistudi website links inside the selected language while preserving query/hash.
    const internalPageForPath=pathname=>{
      let parts=pathname.split('/').filter(Boolean);
      if(parts[0]&&SUPPORTED[parts[0]])parts=parts.slice(1);
      const p='/'+parts.join('/');
      if(p==='/'||p===''||p==='/index.html'||p==='/platform'||p==='/platform/'||p==='/platform/index.html')return '/';
      if(/^\/blocks-activities(?:\/|\/index\.html)?$/.test(p))return '/blocks-activities/';
      if(/^\/organisations(?:\/|\/index\.html)?$/.test(p))return '/organisations/';
      if(/^\/contact(?:\/|\/index\.html)?$/.test(p))return '/contact/';
      return null;
    };
    const localiseInternalLinks=()=>{
      document.querySelectorAll('a[href]').forEach(a=>{
        if(a.dataset.wsPublish==='1')return;
        const raw=a.getAttribute('href')||'';
        if(!raw||raw.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(raw))return;
        let url;try{url=new URL(raw,document.baseURI);}catch(_){return;}
        if(url.origin!==location.origin)return;
        const suffix=internalPageForPath(url.pathname);if(!suffix)return;
        a.href=localePath(locale,suffix)+url.search+url.hash;
      });
    };
    localiseInternalLinks();

    // Replace the placeholder language menu with the complete multilingual selector.
    document.querySelectorAll('.ws-lang').forEach(lang=>{
      const toggle=lang.querySelector('.ws-lang-toggle');
      const menu=lang.querySelector('.ws-lang-menu');
      if(!toggle||!menu)return;
      toggle.innerHTML=`<img class="ws-lang-flag" src="${localeInfo.flag}" alt=""><span>${localeInfo.code}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5"/></svg>`;
      toggle.setAttribute('aria-label',`${localeInfo.label} — Language`);
      menu.setAttribute('aria-label','Language');
      menu.innerHTML=Object.entries(SUPPORTED).map(([code,item])=>`<button class="ws-lang-option${code===locale?' current':''}" type="button" role="menuitem" data-locale="${code}"${code===locale?' aria-current="true"':''}><span class="ws-lang-option-label"><img class="ws-lang-flag" src="${item.flag}" alt=""><span>${item.label}</span></span><span class="ws-lang-code">${item.code}</span></button>`).join('');
      toggle.addEventListener('click',e=>{e.stopPropagation();const open=!lang.classList.contains('open');document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));lang.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));});
      menu.addEventListener('click',e=>{
        e.stopPropagation();const option=e.target.closest('[data-locale]');if(!option)return;
        const next=option.dataset.locale;if(!SUPPORTED[next])return;
        cookieLocale(next);
        const target=localePath(next)+location.search+location.hash;
        if(target!==location.pathname+location.search+location.hash)location.assign(target);
        else lang.classList.remove('open');
      });
    });

    translateDocument();
    // Translate text inserted later by the carousel, contact helper, gallery and other dynamic UI.
    if(locale!=='en'&&'MutationObserver' in window){
      const observer=new MutationObserver(records=>{
        records.forEach(record=>{
          if(record.type==='characterData')translateTextNode(record.target);
          record.addedNodes?.forEach(node=>{
            if(node.nodeType===Node.TEXT_NODE)translateTextNode(node);
            else if(node.nodeType===Node.ELEMENT_NODE)translateElement(node);
          });
        });
      });
      observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    }

    const header=document.querySelector('.ws-site-header');
    const mobile=document.querySelector('.ws-mobile-menu');
    const menuBtn=document.querySelector('.ws-menu-toggle');
    if(menuBtn&&mobile){menuBtn.addEventListener('click',()=>{const open=mobile.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});}
    document.addEventListener('click',()=>document.querySelectorAll('.ws-lang.open').forEach(x=>{x.classList.remove('open');const t=x.querySelector('.ws-lang-toggle');if(t)t.setAttribute('aria-expanded','false');}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));if(mobile)mobile.classList.remove('open');if(menuBtn)menuBtn.setAttribute('aria-expanded','false');}});

    document.addEventListener('click',e=>{
      const a=e.target.closest?.('a');if(!a)return;
      if(a.dataset.wsPublish==='1'){
        e.preventDefault();window.location.assign(SIGNUP_URL);
      }
    },true);

    // Media loading optimisation without changing source quality.
    document.querySelectorAll('img').forEach((img,index)=>{
      if(!img.hasAttribute('decoding'))img.decoding='async';
      const r=img.getBoundingClientRect();const aboveFold=r.top<window.innerHeight*1.15;
      if(!aboveFold&&!img.hasAttribute('loading'))img.loading='lazy';
      if(index===0&&aboveFold&&'fetchPriority'in img)img.fetchPriority='high';
    });
    const siteVideos=[...document.querySelectorAll('video:not(.carousel-card video)')];
    siteVideos.forEach(video=>{const r=video.getBoundingClientRect();const aboveFold=r.top<window.innerHeight*1.15;if(!aboveFold&&video.preload==='auto')video.preload='metadata';});
    if('IntersectionObserver'in window){
      const mediaObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{const video=entry.target;if(entry.isIntersecting){if(video.autoplay)video.play().catch(()=>{});}else if(video.autoplay){video.pause();}});},{threshold:.08,rootMargin:'180px 0px'});
      siteVideos.forEach(video=>mediaObserver.observe(video));
    }

    // Contact CTAs can preselect the enquiry type via /contact/?type=...
    if(document.body.classList.contains('page-contact')){
      const params=new URLSearchParams(location.search);const type=params.get('type');const select=document.getElementById('enquiry');
      if(type&&select&&[...select.options].some(o=>o.value===type)){select.value=type;select.dispatchEvent(new Event('change',{bubbles:true}));}
    }

    // Shared sticky section navigation / scroll spy for Platform, Blocks & Activities, and Organisations.
    document.querySelectorAll('.subnav-wrap.ws-section-subnav').forEach(wrap=>{
      const nav=wrap.querySelector('.subnav');const links=[...wrap.querySelectorAll('a[href^="#"]')];
      const pairs=links.map(a=>{const id=decodeURIComponent(a.getAttribute('href').slice(1));return{a,target:document.getElementById(id)}}).filter(x=>x.target);
      if(!pairs.length)return;let raf=0;
      const update=()=>{raf=0;const headH=(document.querySelector('.ws-site-header')?.offsetHeight||72);const offset=headH+(wrap.offsetHeight||60)+24;let chosen=pairs[0];for(const pair of pairs){if(pair.target.getBoundingClientRect().top<=offset)chosen=pair;else break;}if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)chosen=pairs[pairs.length-1];pairs.forEach(p=>p.a.classList.toggle('active',p===chosen));const active=chosen.a;if(nav&&active){const left=active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2;const max=Math.max(0,nav.scrollWidth-nav.clientWidth);nav.scrollTo({left:Math.max(0,Math.min(left,max)),behavior:'auto'});}};
      const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};links.forEach(a=>a.addEventListener('click',()=>{links.forEach(x=>x.classList.toggle('active',x===a));}));window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});update();
    });

    // Unified fast section fade for the three long-form website pages.
    if(document.body.matches('.page-platform,.page-blocks,.page-organisations')){
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const sections=[...document.querySelectorAll('main > section:not(.hero)')];
      if(reduced||!('IntersectionObserver'in window)){sections.forEach(section=>section.classList.add('ws-scroll-section','ws-section-visible'));}
      else{const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('ws-section-visible');sectionObserver.unobserve(entry.target);}});},{threshold:.045,rootMargin:'0px 0px -3% 0px'});sections.forEach(section=>{section.classList.add('ws-scroll-section');const r=section.getBoundingClientRect();if(r.top<window.innerHeight*.94&&r.bottom>0)requestAnimationFrame(()=>section.classList.add('ws-section-visible'));else sectionObserver.observe(section);});}
    }

    if(document.body.classList.contains('page-blocks')){
      const stack=document.querySelector('.blocks-demo-video,.media-card.stack-video video');
      if(stack){stack.defaultPlaybackRate=1.3;stack.playbackRate=1.3;stack.addEventListener('loadedmetadata',()=>{stack.defaultPlaybackRate=1.3;stack.playbackRate=1.3;},{once:true});}
      const carouselTrack=document.getElementById('carouselTrack');const carouselShell=document.querySelector('.carousel-shell');
      if(carouselTrack&&carouselShell&&typeof window.updateCarousel==='function'){
        window.updateCarousel=function(animate=true){
          const cards=[...carouselTrack.querySelectorAll('.carousel-card')];if(!cards.length||!filtered.length)return;
          renderPosition=Math.max(0,Math.min(renderPosition,cards.length-1));currentIndex=mod(renderPosition,filtered.length);carouselTrack.classList.toggle('no-transition',!animate||prefersReducedMotion);
          cards.forEach((card,i)=>{const active=i===renderPosition;card.classList.toggle('active',active);card.setAttribute('aria-current',active?'true':'false');const video=card.querySelector('video');if(video){if(active&&!modalPaused)video.play().catch(()=>{});else{video.pause();try{if(!active)video.currentTime=0}catch(_){}}}const top=card.querySelector('.carousel-top');const logical=Number(card.dataset.logical);if(top)top.innerHTML=`<span class="chip">${filtered[logical]?.category||''}</span>${active?'<span class="chip playchip">Live preview</span>':''}`;});
          const styles=getComputedStyle(carouselTrack);const gap=parseFloat(styles.columnGap||styles.gap)||24;const activeCard=cards[renderPosition];const cardCenter=activeCard.offsetLeft+activeCard.offsetWidth/2;const offset=carouselShell.clientWidth/2-cardCenter;carouselTrack.style.transform=`translate3d(${offset}px,0,0)`;
          if(!animate||prefersReducedMotion)requestAnimationFrame(()=>carouselTrack.classList.add('no-transition'));
        };
        requestAnimationFrame(()=>window.updateCarousel(false));setTimeout(()=>window.updateCarousel(false),180);window.addEventListener('resize',()=>window.updateCarousel(false),{passive:true});window.addEventListener('orientationchange',()=>setTimeout(()=>window.updateCarousel(false),120),{passive:true});
        carouselTrack.addEventListener('play',e=>{const video=e.target;if(video?.tagName==='VIDEO'&&!video.closest('.carousel-card')?.classList.contains('active')){video.pause();try{video.currentTime=0}catch(_){}}},true);
      }
    }
  });
})();

// Keep every long-form page section submenu pinned exactly below the live header height.
(()=>{
  const header=document.querySelector('.ws-site-header');const subnav=document.querySelector('.ws-section-subnav');if(!header||!subnav)return;
  const syncStickyOffsets=()=>{const headerHeight=Math.ceil(header.getBoundingClientRect().height||0);const subnavHeight=Math.ceil(subnav.getBoundingClientRect().height||0);if(headerHeight)document.documentElement.style.setProperty('--ws-header-height',`${headerHeight}px`);if(subnavHeight)document.documentElement.style.setProperty('--ws-subnav-height',`${subnavHeight}px`);};
  syncStickyOffsets();window.addEventListener('resize',syncStickyOffsets,{passive:true});window.addEventListener('orientationchange',syncStickyOffsets,{passive:true});if('ResizeObserver'in window){const ro=new ResizeObserver(syncStickyOffsets);ro.observe(header);ro.observe(subnav);}
})();

// ACTUAL VIEWPORT-STICKY SUBNAV FIX
(()=>{
  const init=()=>{
    const header=document.querySelector('.ws-site-header');const subnav=document.querySelector('.ws-section-subnav');if(!header||!subnav)return;
    const placeholder=document.createElement('div');placeholder.className='ws-subnav-placeholder';subnav.parentNode.insertBefore(placeholder,subnav);let triggerY=0;let ticking=false;
    const setVars=()=>{const headerH=Math.ceil(header.getBoundingClientRect().height||0);const subnavH=Math.ceil(subnav.getBoundingClientRect().height||0);if(headerH)document.documentElement.style.setProperty('--ws-header-height',`${headerH}px`);if(subnavH)document.documentElement.style.setProperty('--ws-subnav-height',`${subnavH}px`);return{headerH,subnavH};};
    const update=()=>{ticking=false;const{subnavH}=setVars();const shouldFix=window.scrollY>=triggerY;if(shouldFix){placeholder.style.height=`${subnavH}px`;placeholder.classList.add('active');subnav.classList.add('ws-subnav-fixed');}else{subnav.classList.remove('ws-subnav-fixed');placeholder.classList.remove('active');placeholder.style.height='0px';}};
    const measure=()=>{subnav.classList.remove('ws-subnav-fixed');placeholder.classList.remove('active');placeholder.style.height='0px';const{headerH}=setVars();triggerY=subnav.getBoundingClientRect().top+window.scrollY-headerH;update();};
    const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};requestAnimationFrame(measure);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure,{passive:true});window.addEventListener('orientationchange',measure,{passive:true});if('ResizeObserver'in window){const ro=new ResizeObserver(measure);ro.observe(header);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
