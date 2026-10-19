const vi=location.pathname.includes('/vi/'),locale=vi?'vi':'en',$=id=>document.getElementById(id);
const slug=new URLSearchParams(location.search).get('slug')||'';
$('langEn').href='/client-room/partner/?slug='+encodeURIComponent(slug);$('langVi').href='/client-room/vi/partner/?slug='+encodeURIComponent(slug);
function videoSource(value){try{const u=new URL(value,location.origin),h=u.hostname.replace(/^www\./,'').toLowerCase();if(h==='youtu.be'){const id=u.pathname.split('/').filter(Boolean)[0];if(id)return ['iframe','https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)]}if(h==='youtube.com'||h==='m.youtube.com'){let id=u.searchParams.get('v');if(!id&&u.pathname.startsWith('/embed/'))id=u.pathname.split('/')[2];if(id)return ['iframe','https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)]}if(h==='vimeo.com'||h==='player.vimeo.com'){const id=u.pathname.split('/').find(x=>/^\d+$/.test(x));if(id)return ['iframe','https://player.vimeo.com/video/'+id]}return ['video',u.href]}catch{return null}}
function renderPartner(p){
 $('banner').fetchPriority='high';$('banner').src=p.banner_url;$('banner').alt=p.title;$('title').textContent=p.title;$('short').textContent=p.short_description||'';$('about').textContent=p.about_text||'';$('website').href=p.website_url||'#';$('website').hidden=!p.website_url;
 const tags=$('tags');tags.replaceChildren();(p.tags||[]).forEach(t=>{const s=document.createElement('span');s.className='tag';s.textContent=t;tags.append(s)});
 const bullets=$('bullets');bullets.replaceChildren();(p.capability_bullets||[]).forEach(x=>{const li=document.createElement('li');li.textContent=x;bullets.append(li)});
 const wrap=$('videoWrap');wrap.replaceChildren();wrap.hidden=true;
 if(p.video_url){const src=videoSource(p.video_url);if(src){const launch=document.createElement('button');launch.type='button';launch.className='partner-video-launch';launch.setAttribute('aria-label',(vi?'Phát video: ':'Play video: ')+p.title);launch.onclick=()=>{let el;if(src[0]==='iframe'){el=document.createElement('iframe');el.src=src[1]+(src[1].includes('?')?'&':'?')+'autoplay=1';el.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';el.allowFullscreen=true}else{el=document.createElement('video');el.src=src[1];el.controls=true;el.playsInline=true;el.preload='auto';el.autoplay=true}launch.replaceWith(el)};wrap.append(launch);wrap.hidden=false}}
 const gallery=$('gallery');gallery.replaceChildren();if((p.gallery_urls||[]).length){for(const url of p.gallery_urls){const img=document.createElement('img');img.src=url;img.alt=p.title;img.loading='lazy';gallery.append(img)}$('gallerySection').hidden=false}else $('gallerySection').hidden=true;
 $('status').hidden=true;$('partner').hidden=false;document.title='Wistudi | '+p.title;
}
async function load(){
 if(!slug){$('status').textContent=vi?'Không tìm thấy đối tác.':'Partner not found.';return}
 const cacheKey='wistudi-client-partners-'+locale;let cached=null;
 try{const stored=sessionStorage.getItem(cacheKey);if(stored){const data=JSON.parse(stored);cached=(data.items||[]).find(x=>x.slug===slug)||null;if(cached)renderPartner(cached)}}catch{}
 try{
  const r=await fetch('/api/room-management/ecosystem?room=client&locale='+locale+'&kind=partners&slug='+encodeURIComponent(slug),{cache:'default'}),d=await r.json();
  if(!r.ok||!d.item)throw Error(d.error||'not_found');renderPartner(d.item);
 }catch(e){if(!cached)$('status').textContent=vi?'Không thể tải thông tin đối tác.':'The partner page could not be loaded.'}
}
load();