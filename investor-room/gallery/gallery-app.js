/* Shared, static-manifest-driven Investor Room gallery (EN + VI). */
(()=>{
  'use strict';
  const categories=window.WISTUDI_GALLERY_CATEGORIES||[];
  const manifest=window.WISTUDI_GALLERY_MANIFEST;
  const vi=document.documentElement.lang.toLowerCase().startsWith('vi');
  const words=vi?{
    loading:'Đang tải hình ảnh…',empty:'Chưa có hình ảnh trong bộ sưu tập này.',
    unavailable:'Tạm thời không thể tải thư viện ảnh. Vui lòng thử tải lại trang.',
    image:'hình ảnh',retry:'Không thể tải ảnh. Nhấn để thử lại.',
    fullError:'Không thể tải ảnh. Vui lòng thử lại sau.'
  }:{
    loading:'Loading images…',empty:'No images have been added to this collection yet.',
    unavailable:'The gallery is temporarily unavailable. Please reload the page.',
    image:'images',retry:'Image could not load. Click to retry.',
    fullError:'Image could not load. Please try again later.'
  };
  const bar=document.getElementById('categoryBar');
  const grid=document.getElementById('galleryGrid');
  const status=document.getElementById('galleryState');
  const title=document.getElementById('collectionTitle');
  const description=document.getElementById('collectionDescription');
  const count=document.getElementById('imageCount');
  const lightbox=document.getElementById('lightbox');
  const full=document.getElementById('lightboxImage');
  const caption=document.getElementById('lightboxCaption');
  const close=document.getElementById('closeLightbox');
  if(!bar||!grid||!status||!lightbox||!categories.length)return;

  const params=new URLSearchParams(location.search);
  let active=categories.some(c=>c.slug===params.get('category'))?
    params.get('category'):categories[0].slug;
  const webImage=url=>typeof url==='string' && /\.(?:jpe?g|png|webp|avif|gif)(?:$|[?#])/i.test(url);
  const nameLabel=name=>{
    let s=String(name||'').replace(/\.[^.]+$/,'').replace(/^\d+[\s._-]*/,'')
      .replace(/[_-]+/g,' ').trim();
    return !s||/^img(?:age)?\s*\d*(?:\s*\d+)*$/i.test(s)?'':
      s.replace(/\b\w/g,m=>m.toUpperCase());
  };
  function items(category){
    if(!manifest || !Array.isArray(manifest[category]))return null;
    const root='/investor-room/gallery/images/'+category+'/';
    return manifest[category].map(item=>{
      if(typeof item==='string'){
        const original=root+encodeURIComponent(item);
        return {name:item,thumb:original,display:original,original};
      }
      if(!item || typeof item.name!=='string'||typeof item.thumb!=='string')return null;
      return {name:item.name,thumb:item.thumb,display:item.display||item.thumb,original:item.original||''};
    }).filter(Boolean);
  }
  function renderTabs(){
    bar.replaceChildren();
    categories.forEach(cat=>{
      const tab=document.createElement('button');
      tab.type='button';
      tab.className='category-btn'+(cat.slug===active?' active':'');
      tab.textContent=cat.label;
      tab.setAttribute('aria-pressed',String(cat.slug===active));
      tab.addEventListener('click',()=>{
        if(active===cat.slug)return;
        active=cat.slug;
        const next=new URL(location.href);
        next.searchParams.set('category',active);
        history.replaceState({},'',next);
        renderTabs();
        renderCollection();
      });
      bar.append(tab);
    });
  }
  function openLightbox(item){
    const selected=item.display;
    full.onerror=()=>{
      full.onerror=null;
      if(webImage(item.original) && selected!==item.original)full.src=item.original;
      else caption.textContent=words.fullError;
    };
    caption.textContent=item.title;
    full.alt=item.title;
    full.decoding='async';
    full.fetchPriority='high';
    full.src=selected;
    lightbox.classList.add('open');
    document.body.style.overflow='hidden';
    close.focus();
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    full.onerror=null;
    full.removeAttribute('src');
    document.body.style.overflow='';
  }
  close.addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&lightbox.classList.contains('open'))closeLightbox();
  });
  function makeCard(item,i,cat){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='gallery-card';
    if(i%9===0)btn.classList.add('wide');
    else if(i%11===5)btn.classList.add('tall');
    const img=document.createElement('img');
    img.alt=nameLabel(item.name)||cat.label+' '+(i+1);
    img.loading=i<4?'eager':'lazy';
    img.fetchPriority=i===0?'high':i<4?'auto':'low';
    img.decoding='async';
    const label=document.createElement('span');
    label.className='gallery-retry';
    label.textContent=words.retry;
    label.hidden=true;
    let fallbackTried=false;
    img.addEventListener('load',()=>{
      btn.classList.remove('is-error');
      btn.classList.add('is-loaded');
      label.hidden=true;
    });
    img.addEventListener('error',()=>{
      if(!fallbackTried && webImage(item.original) && img.src!==new URL(item.original,location.href).href){
        fallbackTried=true;
        img.src=item.original;
        return;
      }
      btn.classList.remove('is-loaded');
      btn.classList.add('is-error');
      label.hidden=false;
    });
    img.src=item.thumb;
    const resolved={...item,title:img.alt};
    btn.addEventListener('click',()=>{
      if(btn.classList.contains('is-error')){
        fallbackTried=false;
        btn.classList.remove('is-error');
        label.hidden=true;
        img.src=item.thumb+(item.thumb.includes('?')?'&':'?')+'retry='+Date.now();
        return;
      }
      openLightbox(resolved);
    });
    btn.append(img,label);
    return btn;
  }
  function renderCollection(){
    const cat=categories.find(c=>c.slug===active)||categories[0];
    title.textContent=cat.label;
    description.replaceChildren();
    cat.desc.forEach((line,index)=>{
      const p=document.createElement('p');
      if(cat.strong.includes(index)){
        const b=document.createElement('strong');b.textContent=line;p.append(b);
      }else p.textContent=line;
      description.append(p);
    });
    // Each filter switches synchronously; no GitHub API dependency and no stale responses.
    const photos=items(cat.slug);
    grid.hidden=true;
    grid.replaceChildren();
    count.textContent='';
    if(photos===null){
      status.textContent=words.unavailable;status.hidden=false;return;
    }
    if(!photos.length){
      status.textContent=words.empty;status.hidden=false;return;
    }
    const fragment=document.createDocumentFragment();
    photos.forEach((item,index)=>fragment.append(makeCard(item,index,cat)));
    grid.append(fragment);
    count.textContent=photos.length+' '+words.image;
    status.hidden=true;
    grid.hidden=false;
  }
  renderTabs();
  renderCollection();
})();
