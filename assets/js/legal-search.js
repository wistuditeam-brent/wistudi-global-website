(()=>{'use strict';
const DOCS=[
  {path:'/terms-and-conditions/',label:'Terms and Conditions'},
  {path:'/privacy/',label:'Privacy Policy'},
  {path:'/cookie-policy/',label:'Cookie Policy'},
  {path:'/credit-usage-policy/',label:'Credit Usage Policy'},
  {path:'/template-publishing-remix-terms/',label:'Template Publishing & Remix Terms'}
];
const norm=s=>(s||'').replace(/\s+/g,' ').trim();
const esc=s=>(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const locale=()=>document.documentElement.dataset.locale||'en';
const NO_RESULTS={en:'No matching legal sections found.',vi:'Không tìm thấy mục pháp lý phù hợp.', 'zh-cn':'未找到匹配的法律条款。',th:'ไม่พบหัวข้อกฎหมายที่ตรงกัน',id:'Tidak ada bagian hukum yang cocok.',ms:'Tiada bahagian undang-undang yang sepadan.',ar:'لم يتم العثور على أقسام قانونية مطابقة.'};
const localizeUrl=(path,hash='')=>{
  const u=new URL(path,location.origin);
  const code=locale();
  if(code!=='en')u.searchParams.set('lang',code);
  u.hash=hash;
  return u.pathname+(u.search||'')+(u.hash||'');
};
const loadDict=async code=>{
  if(!code||code==='en')return {};
  try{const r=await fetch('/assets/i18n/'+code+'-legal.json',{cache:'default'});if(!r.ok)return{};const j=await r.json();return j.strings||j}catch(_){return{}}
};
const translateTree=(root,dict)=>{
  const walk=node=>{
    if(node.nodeType===Node.TEXT_NODE){
      const raw=node.nodeValue||'',key=norm(raw);
      if(key&&dict[key]){
        const lead=raw.match(/^\s*/)?.[0]||'',trail=raw.match(/\s*$/)?.[0]||'';
        node.nodeValue=lead+dict[key]+trail;
      }
      return;
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    [...node.childNodes].forEach(walk);
  };
  walk(root);
};
const buildIndex=async()=>{
  const code=locale(),dict=await loadDict(code);
  const docs=await Promise.all(DOCS.map(async d=>{
    try{
      const r=await fetch(d.path,{cache:'default'});if(!r.ok)throw new Error();
      const html=await r.text(),parsed=new DOMParser().parseFromString(html,'text/html');
      const content=parsed.querySelector('.doc-content');if(!content)return[];
      if(code!=='en')translateTree(content,dict);
      const title=(dict[d.label]||d.label);
      const heads=[...content.querySelectorAll('h2[id]')];
      return heads.map((h,i)=>{
        const parts=[h.textContent],next=heads[i+1];
        let n=h.nextElementSibling;
        while(n&&n!==next){parts.push(n.textContent);n=n.nextElementSibling}
        const text=norm(parts.join(' '));
        return {doc:title,path:d.path,id:h.id,title:norm(h.textContent),text};
      });
    }catch(_){return[]}
  }));
  return docs.flat();
};
const snippet=(text,q)=>{
  const low=text.toLocaleLowerCase(),needle=q.toLocaleLowerCase(),i=low.indexOf(needle);
  const start=Math.max(0,(i<0?0:i)-58),end=Math.min(text.length,(i<0?0:i)+needle.length+118);
  return (start?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
};
const init=async()=>{
  const root=document.querySelector('.legal-search');if(!root)return;
  const input=root.querySelector('.legal-search-input'),results=root.querySelector('.legal-search-results'),clear=root.querySelector('.legal-search-clear');
  let index=null,active=-1,last=[];
  const ensure=async()=>index||(index=await buildIndex());
  const close=()=>{results.hidden=true;active=-1};
  const render=async()=>{
    const q=norm(input.value);
    clear.hidden=!q;
    if(q.length<2){close();return}
    const data=await ensure(),terms=q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const scored=data.map(item=>{
      const title=item.title.toLocaleLowerCase(),text=item.text.toLocaleLowerCase();
      let score=0;
      terms.forEach(t=>{if(title.includes(t))score+=8;if(text.includes(t))score+=2});
      if(title.includes(q.toLocaleLowerCase()))score+=12;
      return {item,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title)).slice(0,12);
    last=scored;
    if(!scored.length){
      results.innerHTML='<div class="legal-search-empty">'+esc(NO_RESULTS[locale()]||NO_RESULTS.en)+'</div>';
      results.hidden=false;return;
    }
    results.innerHTML=scored.map((x,i)=>'<a class="legal-search-result" role="option" data-i="'+i+'" href="'+esc(localizeUrl(x.item.path,'#'+x.item.id))+'"><span class="legal-search-result-doc">'+esc(x.item.doc)+'</span><span class="legal-search-result-title">'+esc(x.item.title)+'</span><span class="legal-search-result-snippet">'+esc(snippet(x.item.text,q))+'</span></a>').join('');
    results.hidden=false;active=-1;
  };
  let timer;
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,90)});
  input.addEventListener('focus',()=>{if(norm(input.value).length>=2)render()});
  clear.addEventListener('click',()=>{input.value='';clear.hidden=true;close();input.focus()});
  input.addEventListener('keydown',e=>{
    if(results.hidden)return;
    const items=[...results.querySelectorAll('.legal-search-result')];if(!items.length)return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
      items.forEach((a,i)=>a.classList.toggle('active',i===active));items[active].scrollIntoView({block:'nearest'});
    }else if(e.key==='Enter'&&active>=0){e.preventDefault();items[active].click()}
    else if(e.key==='Escape'){close();input.blur()}
  });
  document.addEventListener('click',e=>{if(!root.contains(e.target))close()});
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();