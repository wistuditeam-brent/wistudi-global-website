(()=>{
  'use strict';
  const form=document.querySelector('.support-search');
  if(!form)return;
  const input=form.querySelector('input');
  const filters=document.querySelector('.support-filter-bar');
  const buttons=[...filters.querySelectorAll('[data-support-category]')];
  const categories=[...document.querySelectorAll('.support-category')];
  const status=document.querySelector('.support-search-status');
  const empty=document.querySelector('.support-empty');
  const normalize=value=>value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const topics=categories.flatMap(category=>[...category.querySelectorAll('.support-topic')].map(element=>({element,category,text:normalize(category.querySelector('header').textContent+' '+element.textContent)})));
  let selected='all';
  const validCategory=value=>buttons.some(button=>button.dataset.supportCategory===value)?value:'all';
  const readURL=()=>{
    const params=new URLSearchParams(location.search);
    input.value=params.get('q')||'';
    selected=validCategory(params.get('category')||'all');
  };
  function apply(updateURL=true){
    const words=normalize(input.value).split(' ').filter(Boolean);
    let count=0;
    topics.forEach(topic=>{
      const show=(selected==='all'||topic.category.id===selected)&&words.every(word=>topic.text.includes(word));
      topic.element.hidden=!show;
      if(show)count++;
    });
    categories.forEach(category=>{category.hidden=![...category.querySelectorAll('.support-topic')].some(topic=>!topic.hidden)});
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.supportCategory===selected)));
    empty.hidden=count!==0;
    status.hidden=false;
    status.textContent=count===topics.length&&!words.length&&selected==='all'?'Browse all support topics.':`${count} ${count===1?'topic':'topics'} found${input.value.trim()?` for “${input.value.trim()}”`:''}.`;
    document.querySelectorAll('.doc-scroll-nav a,.support-mobile-toc a').forEach(link=>{
      const category=categories.find(section=>link.hash==='#'+section.id);
      if(category)link.closest('li').hidden=category.hidden;
    });
    if(updateURL){
      const url=new URL(location.href);
      if(input.value.trim())url.searchParams.set('q',input.value.trim());else url.searchParams.delete('q');
      if(selected==='all')url.searchParams.delete('category');else url.searchParams.set('category',selected);
      history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
  }
  function openHash(){
    let id;try{id=decodeURIComponent(location.hash.slice(1))}catch(_){return}
    const target=document.getElementById(id);
    if(!target)return;
    const category=categories.find(section=>section===target||section.contains(target));
    if(category&&(target.hidden||category.hidden)){
      input.value='';selected='all';apply();
    }
    if(target.classList.contains('support-topic'))target.open=true;
    if(category)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  }
  form.addEventListener('submit',event=>{event.preventDefault();apply();document.getElementById('support-topics').focus({preventScroll:true})});
  input.addEventListener('input',()=>apply());
  input.addEventListener('keydown',event=>{if(event.key==='Escape'){input.value='';apply()}});
  buttons.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.supportCategory;apply()}));
  document.querySelector('[data-support-reset]').addEventListener('click',()=>{selected='all';input.value='';apply();input.focus()});
  window.addEventListener('popstate',()=>{readURL();apply(false);openHash()});
  window.addEventListener('hashchange',openHash);
  document.querySelectorAll('.support-mobile-toc a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('.support-mobile-toc').open=false}));
  filters.hidden=false;
  readURL();apply(false);openHash();
  // Keep browsing and title search working even if the article index cannot load.
  fetch('/assets/data/support-articles.json',{cache:'default'})
    .then(response=>{if(!response.ok)throw new Error('Article index unavailable');return response.json()})
    .then(articles=>{
      if(!Array.isArray(articles))return;
      articles.forEach(article=>{
        if(typeof article.slug!=='string'||typeof article.text!=='string')return;
        const topic=topics.find(item=>item.element.id==='guide-'+article.slug);
        if(topic)topic.text+=' '+normalize(article.text);
      });
      apply(false);
      form.dataset.searchIndex='ready';
    })
    .catch(()=>{form.dataset.searchIndex='fallback'});
})();

