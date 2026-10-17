import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const locale=location.pathname.includes('/vi/')?'vi':'en',vi=locale==='vi';
const W=vi?{
 title:'Phòng Khách hàng',intro:'Tài liệu và thông tin dành cho khách hàng Wistudi.',
 presentations:'Bài trình bày',videos:'Video',gallery:'Thư viện ảnh',documents:'Tài liệu tải xuống',partners:'Hệ sinh thái Đối tác',
 empty:'Chưa có nội dung được xuất bản.',unavailable:'Hiện không thể tải nội dung. Vui lòng thử lại sau.',retry:'Thử lại',
 private:'Tài liệu dành cho khách hàng',choose:'Chọn một bài trình bày để xem mục lục hoặc bắt đầu trình chiếu.',
 back:'Quay lại danh sách bài trình bày',contents:'Mục lục',start:'Bắt đầu bài trình bày',slides:'trang',
 loading:'Đang tải bài trình bày…',slideError:'Không thể tải bài trình bày. Vui lòng thử lại.',
 images:'hình ảnh',download:'Tải xuống',more:'Khác'
}:{
 title:'Client Room',intro:'Wistudi resources and materials for clients.',
 presentations:'Presentations',videos:'Videos',gallery:'Gallery',documents:'Downloads',partners:'Partner Ecosystem',
 empty:'No published content is available yet.',unavailable:'Content is temporarily unavailable. Please try again.',retry:'Try again',
 private:'Private materials',choose:'Choose a presentation, then open its contents or start the slides.',
 back:'Back to presentations',contents:'Contents',start:'Start presentation',slides:'slides',
 loading:'Loading presentation…',slideError:'The presentation could not be loaded. Please try again.',
 images:'images',download:'Download',more:'More'
};
const $=id=>document.getElementById(id);
const categories=[['presentation',W.presentations],['video',W.videos],['gallery',W.gallery],['document',W.documents],['partner',W.partners]];
let items=[],videoGroups=[],partners=[],partnerSettings=null,active='presentation',failed=false,currentDeck=null,currentSlide=1,totalSlides=1,pdfDoc=null,rendering=false,queued=null,galleryCategory=null,videoCategory=null;
const canvas=$('slideCanvas'),ctx=canvas.getContext('2d');

const OVERVIEW_EN=[
 ['01','Wistudi overview','Vision, team and the connected learning environment',1,'Slides 1-3'],
 ['02','Problem & publishing layer','What Wistudi solves, authoring and publishing, and the connected learning core',4,'Slides 4-6'],
 ['03','Learning experiences','Modular lessons, XP Video and interactive + printable learning',7,'Slides 7-9'],
 ['04','Platform positioning & support','How Wistudi complements LMS and EdTech tools, backed by educator-led support',10,'Slides 10-11'],
 ['05','Validation & routes to market','Market validation and creator-led, institutional and partner-led distribution',12,'Slides 12-13'],
 ['06','Commercial model & ecosystem scale','Usage-led growth, partner distribution, institutional scale and next steps',14,'Slides 14-16']
];
const OVERVIEW_VI=[
 ['01','Giới thiệu & nội dung','Tổng quan khung hợp tác và mô hình phân phối Wistudi',1,'Trang 1-2'],
 ['02','Tổng quan khung hợp tác','Cách Wistudi tiếp cận hợp tác, tích hợp và triển khai',3,'Trang 3-4'],
 ['03','Trải nghiệm sản phẩm','Flow, XP Video, nội dung tương tác và tài nguyên in',5,'Trang 5-8'],
 ['04','Mô hình thương mại','Cấp phép, bán lại, đồng bán và mở rộng hệ sinh thái',9,'Trang 9-13']
];
const PATH_EN=[
 ['01','Distribution opportunities','Three ways distributors can bring Wistudi to market',1,'Slide 1'],
 ['02','How distributors work with Wistudi','Commercial pathways for licensing, resale and local selling',2,'Slide 2'],
 ['03','Bringing opportunities to market','Platform, partners and distributors working together locally',3,'Slide 3']
];
const PATH_VI=[
 ['01','Cơ hội phân phối','Ba cách đưa Wistudi ra thị trường',1,'Trang 1'],
 ['02','Mô hình hợp tác','Các cách nhà phân phối hợp tác thương mại với Wistudi',2,'Trang 2'],
 ['03','Đưa cơ hội ra thị trường','Nền tảng, đối tác và nhà phân phối tạo thành hoạt động tại địa phương',3,'Trang 3']
];
const GALLERY=vi?[
 {slug:'wistudi-events',label:'Sự kiện Wistudi',desc:['Bất kỳ ai từng tự mình xây dựng một điều gì đó từ con số không, bằng chính nguồn lực và uy tín của mình, đều hiểu hành trình ấy thực sự có ý nghĩa lớn đến nhường nào.','Mọi người có thể nhìn thấy gian hàng, phần trình bày và những cuộc trò chuyện. Nhưng phía sau đó là nhiều năm ấp ủ ý tưởng, làm việc chăm chỉ, thử nghiệm, vượt qua trở ngại và biến kế hoạch thành hiện thực.','Xây dựng Wistudi chưa bao giờ chỉ đơn thuần là tạo ra một nền tảng. Đó là hành trình biến một tầm nhìn thành điều gì đó có thật, hữu ích và có ý nghĩa với mọi người.','Tự hào về chặng đường đã qua và càng mong chờ những điều sắp tới!'],strong:[]},
 {slug:'real-moments',label:'Khoảnh khắc thực tế',desc:['Tạo một lần. Dạy ở bất cứ đâu.','Từ bài học tương tác đến tài liệu in dùng trong lớp, tất cả được tạo cùng lúc trong Wistudi Publishing.','Trong những hình ảnh này, một giáo viên đã tạo ra trải nghiệm học tập tương tác hoàn chỉnh để giảng dạy trực tiếp trên lớp, chia sẻ cho học viên tự luyện tập tại nhà, đồng thời chuyển ngay thành phiếu bài tập và tài liệu chương trình giảng dạy có thể tải xuống, in ra để thực hành tại lớp.','Một quy trình sáng tạo, nhiều cách dạy và học. Kết nối liền mạch việc học trên nền tảng số với hoạt động giảng dạy thực tế trong lớp học.','Tạo. Dạy. Chia sẻ. Xuất bản. Tất cả trong một nền tảng.'],strong:[0,4]},
 {slug:'classroom-moments',label:'Khoảnh khắc lớp học',desc:['Đưa công cụ xuất bản nội dung tương tác chuyên nghiệp đến tay mọi nhà giáo dục.','Từ chương trình giảng dạy và bài học tương tác hoàn chỉnh đến phiếu bài tập có thể tải xuống và tài liệu giảng dạy có thể in, Wistudi mang những khả năng xuất bản mạnh mẽ vốn thường chỉ dành cho các nhà xuất bản giáo dục thương mại lớn đến với giáo viên hằng ngày.','Với Trợ lý AI Wistudi, nhà giáo dục có thể tạo ra những trải nghiệm học tập tương tác toàn diện chỉ trong vài phút, ngay trên một nền tảng duy nhất.','Tạo. Dạy. Chia sẻ. Xuất bản. Tất cả trong một nền tảng.'],strong:[0,3]}
]:[
 {slug:'wistudi-events',label:'Wistudi Events',desc:['Anyone who has ever truly built something from the ground up with their own resources and name on it will understand the full scale of what it represents.','People may see the booth, the presentation and the conversations, but behind it are years of ideas, hard work, testing, setbacks and execution.','Building Wistudi has never been just about creating a platform. It has been about turning a vision into something real, useful and meaningful for people.','Proud of the journey so far, and even more excited for what comes next!!'],strong:[]},
 {slug:'real-moments',label:'Real Moments',desc:['Create once. Teach anywhere.','From interactive lessons to printable classroom resources, all created together in Wistudi Publishing.','Here, a teacher created a complete interactive learning experience that could be delivered live in the classroom, shared with learners for independent practice at home, and instantly converted into downloadable, printable worksheets and curriculum materials for hands-on classroom activities.','One creation process. Multiple ways to teach and learn. Seamlessly connecting digital learning with real-world classroom teaching.','Create. Teach. Share. Publish. All in one place.'],strong:[0,4]},
 {slug:'classroom-moments',label:'Classroom Moments',desc:['Bringing professional interactive publishing into the hands of every educator.','From complete curricula and interactive lessons to downloadable worksheets and printable teaching resources, Wistudi brings powerful publishing capabilities, traditionally reserved for major commercial educational publishers, to everyday educators.','With the Wistudi AI Assistant, educators can create comprehensive, interactive learning experiences in minutes, all from one platform.','Create. Teach. Share. Publish. All in one place.'],strong:[0,3]}
];

function deckMeta(item){
 if(item.id==='seed-pres-en-overview')return {...item,type:'pages',pages:16,base:'/client-room/starter-assets/assets/presentation/overview-en-pages/',chapters:OVERVIEW_EN};
 if(item.id==='seed-pres-vi-overview')return {...item,type:'pages',pages:13,base:'/client-room/starter-assets/vi/assets/presentation/overview-vi-pages/',chapters:OVERVIEW_VI};
 if(item.id==='seed-pres-en-pathways')return {...item,type:'pdf',pages:3,url:'/client-room/starter-assets/assets/presentation/Distributor-Pathways-EN.pdf',chapters:PATH_EN};
 if(item.id==='seed-pres-vi-pathways')return {...item,type:'pdf',pages:3,url:'/client-room/starter-assets/vi/assets/presentation/Distributor-Pathways-VN.pdf',chapters:PATH_VI};
 return {...item,type:'pdf',pages:null,url:item.asset_url,chapters:[]};
}
function text(tag,value,cls){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e}
function safeUrl(value){try{const u=new URL(value,location.origin);return u.origin===location.origin?u.href:null}catch{return null}}
function renderTabs(){
 $('tabs').replaceChildren();
 for(const [key,label] of categories){const b=text('button',label,'tab'+(key===active?' selected':''));b.type='button';b.setAttribute('aria-pressed',String(key===active));b.onclick=()=>{active=key;currentDeck=null;galleryCategory=null;videoCategory=null;render()};$('tabs').append(b)}
}
function render(){
 renderTabs();$('content').replaceChildren();$('status').textContent='';$('heading').textContent='';
 if(failed){$('status').textContent=W.unavailable;const b=text('button',W.retry,'retry');b.onclick=load;$('content').append(b);return}
 if(active==='partner'){renderPartners();return}
 const shown=items.filter(x=>x.category===active);
 if(!shown.length){$('status').textContent=W.empty;return}
 if(active==='presentation')renderPresentations(shown);
 if(active==='video')renderVideos(shown);
 if(active==='gallery')renderGallery(shown);
 if(active==='document')renderDownloads(shown);
}
function renderPresentations(list){
 const wrap=document.createElement('div');wrap.className='presentation-layout';
 const intro=document.createElement('section');intro.className='presentation-copy';intro.append(text('div',W.private,'kicker'),text('h2',W.presentations,'big-title'),text('p',W.choose,'copy'));
 const rows=document.createElement('div');rows.className='list';
 for(const item of list){const d=deckMeta(item),b=document.createElement('button');b.className='row';const left=document.createElement('span');left.append(text('span',item.title,'row-title'));if(item.description)left.append(text('span',item.description,'row-note'));const meta=text('span',d.pages?d.pages+' '+W.slides:W.presentations,'row-meta');b.append(left,meta);b.onclick=()=>showContents(d);rows.append(b)}
 wrap.append(intro,rows);$('content').append(wrap);
}
async function showContents(deck){
 currentDeck=deck;pdfDoc=null;currentSlide=1;totalSlides=deck.pages||1;
 const wrap=document.createElement('div');wrap.className='toc-layout';
 const left=document.createElement('section');const back=text('button','← '+W.back,'back-btn');back.onclick=()=>render();left.append(back,text('div',W.contents,'kicker'),text('h2',deck.title,'big-title'),text('p',deck.description||'','copy'));const start=text('button',W.start,'start-btn');start.onclick=()=>openSlide(1);left.append(start);
 const rows=document.createElement('div');rows.className='list';
 let chapters=deck.chapters||[];
 if(!chapters.length){chapters=[['01',deck.title,deck.description||'',1,W.start]]}
 for(const ch of chapters){const b=document.createElement('button');b.className='row chapter-row';b.append(text('span',ch[0],'chapter-num'));const mid=document.createElement('span');mid.append(text('span',ch[1],'row-title'),text('span',ch[2],'row-note'));b.append(mid,text('span',ch[4],'row-meta'));b.onclick=()=>openSlide(ch[3]);rows.append(b)}
 wrap.append(left,rows);$('content').replaceChildren(wrap);$('heading').textContent='';scrollTo({top:$('tabsWrap').offsetTop-68,behavior:'smooth'});
 if(deck.type==='pdf'&&!deck.pages){try{const p=await ensurePdf();deck.pages=p.numPages;totalSlides=p.numPages}catch{}}
}
async function ensurePdf(){
 if(pdfDoc)return pdfDoc;
 if(!currentDeck?.url)throw Error('missing_pdf');
 pdfDoc=await pdfjsLib.getDocument(safeUrl(currentDeck.url)).promise;totalSlides=pdfDoc.numPages;return pdfDoc;
}
async function overviewPage(n){
 const url=currentDeck.base+'slide-'+String(n).padStart(2,'0')+'.pdf';
 const doc=await pdfjsLib.getDocument(url).promise;return doc.getPage(1);
}
async function renderSlide(n){
 if(rendering){queued=n;return}
 rendering=true;queued=null;$('slideLoading').hidden=false;$('slideCanvas').hidden=true;$('slideError').hidden=true;
 try{
  const page=currentDeck.type==='pages'?await overviewPage(n):await (await ensurePdf()).getPage(n);
  const base=page.getViewport({scale:1});const maxW=Math.max(320,innerWidth-140),maxH=Math.max(260,innerHeight-190);const scale=Math.min(maxW/base.width,maxH/base.height,2.2);const vp=page.getViewport({scale});const dpr=Math.min(devicePixelRatio||1,2);
  const buffer=document.createElement('canvas');buffer.width=Math.round(vp.width*dpr);buffer.height=Math.round(vp.height*dpr);
  await page.render({canvasContext:buffer.getContext('2d'),viewport:vp,transform:[dpr,0,0,dpr,0,0]}).promise;
  canvas.width=buffer.width;canvas.height=buffer.height;canvas.style.width=vp.width+'px';canvas.style.height=vp.height+'px';ctx.drawImage(buffer,0,0);canvas.hidden=false;currentSlide=n;updateSlideProgress();
 }catch(e){console.error(e);$('slideError').textContent=W.slideError;$('slideError').hidden=false}
 finally{$('slideLoading').hidden=true;rendering=false;if(queued&&queued!==currentSlide){const q=queued;queued=null;renderSlide(q)}}
}
function openSlide(n){currentSlide=n;$('slideShell').hidden=false;$('slideTitle').textContent=currentDeck.title;renderSlide(n)}
function closeSlides(){$('slideShell').hidden=true;canvas.hidden=true}
function updateSlideProgress(){$('slideCount').textContent=currentSlide+' / '+totalSlides;$('slideProgress').style.width=(currentSlide/totalSlides*100)+'%'}
$('prevSlide').onclick=()=>{if(currentSlide>1)renderSlide(currentSlide-1)};
$('nextSlide').onclick=()=>{if(currentSlide<totalSlides)renderSlide(currentSlide+1);else closeSlides()};
$('backContents').onclick=closeSlides;
$('fullScreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('slideShell').requestFullscreen?.();
addEventListener('keydown',e=>{if(!$('slideShell').hidden){if(e.key==='Escape')closeSlides();if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();$('nextSlide').click()}if(e.key==='ArrowLeft'){$('prevSlide').click()}}});
addEventListener('resize',()=>{if(!$('slideShell').hidden&&currentDeck)renderSlide(currentSlide)});

function videoSource(value){
 try{
  const u=new URL(value,location.origin),host=u.hostname.replace(/^www\./,'').toLowerCase();
  if(host==='youtu.be'){const id=u.pathname.split('/').filter(Boolean)[0];if(id)return {kind:'iframe',url:'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)}}
  if(host==='youtube.com'||host==='m.youtube.com'){let id=u.searchParams.get('v');if(!id&&u.pathname.startsWith('/embed/'))id=u.pathname.split('/')[2];if(id)return {kind:'iframe',url:'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)}}
  if(host==='vimeo.com'||host==='player.vimeo.com'){const id=u.pathname.split('/').filter(Boolean).find(x=>/^\d+$/.test(x));if(id)return {kind:'iframe',url:'https://player.vimeo.com/video/'+id}}
  if(u.origin===location.origin||/\.(mp4|webm)(?:$|[?#])/i.test(u.pathname+u.search))return {kind:'video',url:u.href};
  if(u.protocol==='https:')return {kind:'link',url:u.href};
 }catch{}
 return null;
}
function makeVideoCard(item){
 const source=videoSource(item.asset_url);if(!source)return null;
 const card=document.createElement('article');card.className='media-card';
 if(source.kind==='iframe'){const f=document.createElement('iframe');f.src=source.url;f.loading='lazy';f.title=item.title;f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';card.append(f)}
 else if(source.kind==='video'){const v=document.createElement('video');v.controls=true;v.playsInline=true;v.preload='metadata';v.src=source.url;card.append(v)}
 const body=document.createElement('div');body.className='media-body';body.append(text('h3',item.title));if(item.description)body.append(text('p',item.description));
 if(source.kind==='link'){const a=text('a',vi?'Mở video':'Open video','action');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';body.append(a)}
 card.append(body);return card;
}
function renderVideos(list){
 const groups=videoGroups.filter(g=>list.some(i=>i.video_group_id===g.id));
 const uncategorised=list.some(i=>!i.video_group_id||!videoGroups.some(g=>g.id===i.video_group_id));
 if(!groups.length&&!uncategorised){$('heading').textContent=W.videos;return}
 if(!groups.length){
  $('heading').textContent=W.videos;const grid=document.createElement('div');grid.className='video-grid';for(const item of list){const card=makeVideoCard(item);if(card)grid.append(card)}$('content').append(grid);return;
 }
 const available=[...groups];if(uncategorised)available.push({id:'__other',title:vi?'Video khác':'Other videos',description:vi?'Các video chưa được gán vào danh mục.':'Videos that have not been assigned to a category.',sort_order:999999});
 if(!videoCategory||!available.some(g=>g.id===videoCategory))videoCategory=available[0].id;
 const chips=document.createElement('div');chips.className='gallery-tabs';
 for(const g of available){const b=text('button',g.title,'gallery-chip'+(g.id===videoCategory?' active':''));b.onclick=()=>{videoCategory=g.id;renderVideos(list)};chips.append(b)}
 const group=available.find(g=>g.id===videoCategory),shown=list.filter(i=>videoCategory==='__other'?(!i.video_group_id||!videoGroups.some(g=>g.id===i.video_group_id)):i.video_group_id===videoCategory);
 const head=document.createElement('div');head.className='gallery-head';const left=document.createElement('div');left.append(text('div',W.videos,'kicker'),text('h2',group?.title||W.videos));left.append(text('div',shown.length+' '+(vi?'video':'videos'),'gallery-count'));const desc=document.createElement('div');desc.className='gallery-description';if(group?.description){const p=document.createElement('p');p.textContent=group.description;desc.append(p)}head.append(left,desc);
 const grid=document.createElement('div');grid.className='video-grid';for(const item of shown){const card=makeVideoCard(item);if(card)grid.append(card)}
 $('heading').textContent='';$('content').replaceChildren(chips,head,grid);
}
function gallerySlug(item){
 const id=item.id||'';for(const cat of GALLERY)if(id.includes('-'+cat.slug+'-'))return cat.slug;return 'more';
}
function renderGallery(list){
 const available=GALLERY.filter(c=>list.some(i=>gallerySlug(i)===c.slug));const extra=list.some(i=>gallerySlug(i)==='more');if(extra)available.push({slug:'more',label:W.more,desc:[],strong:[]});if(!galleryCategory||!available.some(c=>c.slug===galleryCategory))galleryCategory=available[0]?.slug||'more';
 const chips=document.createElement('div');chips.className='gallery-tabs';
 for(const cat of available){const b=text('button',cat.label,'gallery-chip'+(cat.slug===galleryCategory?' active':''));b.onclick=()=>{galleryCategory=cat.slug;renderGallery(list)};chips.append(b)}
 const cat=available.find(c=>c.slug===galleryCategory)||available[0];const shown=list.filter(i=>gallerySlug(i)===galleryCategory);
 const head=document.createElement('div');head.className='gallery-head';const left=document.createElement('div');left.append(text('div',W.gallery,'kicker'),text('h2',cat?.label||W.gallery));const count=text('div',shown.length+' '+W.images,'gallery-count');left.append(count);const desc=document.createElement('div');desc.className='gallery-description';(cat?.desc||[]).forEach((line,i)=>{const p=document.createElement('p');if(cat.strong?.includes(i)){const strong=document.createElement('strong');strong.textContent=line;p.append(strong)}else p.textContent=line;desc.append(p)});head.append(left,desc);
 const grid=document.createElement('div');grid.className='gallery-grid';
 for(const item of shown){const url=safeUrl(item.asset_url);if(!url)continue;const b=document.createElement('button');b.className='gallery-card';const img=document.createElement('img');img.src=url;img.alt=item.title;img.loading='lazy';const cap=text('span',item.title,'gallery-caption');b.append(img,cap);b.onclick=()=>openLightbox(url,item.title);grid.append(b)}
 $('heading').textContent='';$('content').replaceChildren(chips,head,grid);
}
function openLightbox(url,caption){$('lightboxImage').src=url;$('lightboxImage').alt=caption;$('lightboxCaption').textContent=caption;$('lightbox').hidden=false}
$('lightboxClose').onclick=()=>{$('lightbox').hidden=true;$('lightboxImage').src=''};$('lightbox').onclick=e=>{if(e.target===$('lightbox'))$('lightboxClose').click()};

function renderPartners(){
 const wrap=document.createElement('div'),intro=document.createElement('div');intro.className='partner-intro';
 const left=document.createElement('div');left.append(text('div',vi?'Wistudi + Đối tác':'Wistudi + Partners','kicker'),text('h2',partnerSettings?.title||W.partners));
 const right=document.createElement('p');right.textContent=partnerSettings?.intro||(vi?'Các đối tác chuyên biệt giúp mở rộng khả năng của Wistudi.':'Specialist partners extend the capabilities of Wistudi.');
 intro.append(left,right);wrap.append(intro);
 if(!partners.length){const empty=text('p',W.empty,'status');wrap.append(empty);$('content').replaceChildren(wrap);return}
 const list=document.createElement('div');list.className='partner-list';
 for(const p of partners){const a=document.createElement('a');a.className='partner-row';a.href=(vi?'/client-room/vi/partner/':'/client-room/partner/')+'?slug='+encodeURIComponent(p.slug);
  const img=document.createElement('img');img.src=p.banner_url;img.alt=p.title;img.loading='lazy';
  const body=document.createElement('div');body.append(text('h3',p.title));if(p.short_description)body.append(text('p',p.short_description));
  if(Array.isArray(p.tags)&&p.tags.length){const tags=document.createElement('div');tags.className='partner-tags';p.tags.forEach(t=>tags.append(text('span',t,'partner-tag')));body.append(tags)}
  a.append(img,body,text('span','›','partner-arrow'));list.append(a)}
 wrap.append(list);$('heading').textContent='';$('content').replaceChildren(wrap);
}
function renderDownloads(list){
 $('heading').textContent=W.documents;const grid=document.createElement('div');grid.className='download-grid';
 for(const item of list){const url=safeUrl(item.asset_url);if(!url)continue;const card=document.createElement('article');card.className='media-card download-card';card.append(text('h3',item.title));if(item.description)card.append(text('p',item.description));const a=text('a',W.download,'action');a.href=url;a.download='';a.target='_blank';a.rel='noopener noreferrer';card.append(a);grid.append(card)}
 $('content').append(grid);
}
async function load(){
 failed=false;$('status').textContent='';
 try{const [response,partnerResponse]=await Promise.all([fetch('/api/room-management/published?room=client&locale='+locale,{cache:'no-store'}),fetch('/api/room-management/ecosystem?room=client&locale='+locale+'&kind=partners',{cache:'no-store'})]);const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{throw Error(raw||'invalid_response')}if(!response.ok||!data.ok||!Array.isArray(data.items))throw Error(data.detail||data.error||'request_failed');items=data.items;videoGroups=Array.isArray(data.video_groups)?data.video_groups:[];try{const pd=await partnerResponse.json();partners=Array.isArray(pd.items)?pd.items:[];partnerSettings=pd.settings||null}catch{partners=[];partnerSettings=null}render();const requested=new URLSearchParams(location.search).get('presentation');if(requested&&active==='presentation'){const item=items.find(x=>x.id===requested);if(item)showContents(deckMeta(item))}}
 catch(e){console.error(e);items=[];failed=true;render()}
}
$('intro').textContent=W.intro;load();
