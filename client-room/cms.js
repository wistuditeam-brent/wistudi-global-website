(()=>{'use strict';
const locale=location.pathname.includes('/vi/')?'vi':'en';
const vi=locale==='vi';
const words=vi?{title:'Phòng Khách hàng',intro:'Tài liệu và thông tin dành cho khách hàng Wistudi.',presentations:'Bài trình bày',videos:'Video',gallery:'Thư viện ảnh',documents:'Tài liệu tải xuống',empty:'Chưa có nội dung được xuất bản.',unavailable:'Hiện không thể tải nội dung. Vui lòng thử lại sau.',open:'Mở',download:'Tải xuống',home:'Trang chủ',retry:'Thử lại',back:'Quay lại'}:{title:'Client Room',intro:'Wistudi resources and materials for clients.',presentations:'Presentations',videos:'Videos',gallery:'Gallery',documents:'Downloads',empty:'No published content is available yet.',unavailable:'Content is temporarily unavailable. Please try again.',open:'Open',download:'Download',home:'Home',retry:'Try again',back:'Back'};
const categories=[['presentation',words.presentations],['video',words.videos],['gallery',words.gallery],['document',words.documents]];
const main=document.getElementById('content'),tabs=document.getElementById('tabs'),status=document.getElementById('status'),heading=document.getElementById('heading');
let items=[],active='presentation',failed=false;
const allowedAsset=(value)=>{try{const u=new URL(value,location.origin);return u.origin===location.origin&&(/^\/api\/room-management\/media\?/.test(u.pathname+u.search)||u.pathname.startsWith('/client-room/'))?u.href:null}catch{return null}};
function text(tag,value,cls){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e}
function render(){
 heading.textContent=categories.find(c=>c[0]===active)[1];tabs.replaceChildren();main.replaceChildren();
 for(const [key,label] of categories){const b=text('button',label,'tab'+(key===active?' selected':''));b.type='button';b.setAttribute('aria-pressed',String(key===active));b.onclick=()=>{active=key;render()};tabs.append(b)}
 const shown=items.filter(x=>x.category===active);
 status.textContent=failed?words.unavailable:shown.length?'':words.empty;
 if(failed){const b=text('button',words.retry,'retry');b.onclick=load;main.append(b);return}
 for(const item of shown){const url=allowedAsset(item.asset_url);if(!url)continue;
 const card=document.createElement('article');card.className='card';
 if(active==='gallery'){const img=document.createElement('img');img.src=url;img.alt=item.title;img.loading='lazy';card.append(img)}
 if(active==='video'){const video=document.createElement('video');video.controls=true;video.preload='metadata';video.src=url;card.append(video)}
 const body=document.createElement('div');body.className='card-body';body.append(text('h3',item.title));if(item.description)body.append(text('p',item.description));
 if(active!=='video'){const a=text('a',active==='document'?words.download:words.open,'action');a.href=url;a.target='_blank';a.rel='noopener noreferrer';if(active==='document')a.download='';body.append(a)}
 card.append(body);main.append(card)
 }
}
async function load(){status.textContent='';failed=false;try{const response=await fetch('/api/room-management/published?room=client&locale='+locale,{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('request_failed');const data=await response.json();if(!data.ok||!Array.isArray(data.items))throw Error('invalid_data');items=data.items;render()}catch(e){items=[];failed=true;render()}}
document.title='Wistudi | '+words.title;document.getElementById('roomTitle').textContent=words.title;document.getElementById('intro').textContent=words.intro;
document.getElementById('language').href=vi?'/client-room/':'/client-room/vi/';document.getElementById('language').textContent=vi?'English':'Tiếng Việt';
load();
})();