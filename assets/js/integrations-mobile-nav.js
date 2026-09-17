(()=>{
'use strict';

const side=document.querySelector('.doc-side');
if(!side||side.dataset.wsMobileNavReady==='true')return;

const groups=[...side.querySelectorAll('.doc-side-card')].slice(0,2);
if(!groups.length)return;

const closeGroup=group=>{
  group.classList.remove('is-open');
  const button=group.querySelector('.doc-mobile-nav-toggle');
  if(button)button.setAttribute('aria-expanded','false');
};

const closeAll=()=>groups.forEach(closeGroup);

groups.forEach((group,index)=>{
  const heading=group.querySelector('h2');
  const list=group.querySelector('ul');
  if(!heading||!list)return;

  const id=list.id||`doc-mobile-nav-${index+1}`;
  list.id=id;

  const button=document.createElement('button');
  button.type='button';
  button.className='doc-mobile-nav-toggle';
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-controls',id);
  button.innerHTML=`<span>${heading.textContent.trim()}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>`;

  group.insertBefore(button,list);

  button.addEventListener('click',()=>{
    const shouldOpen=!group.classList.contains('is-open');
    closeAll();
    if(shouldOpen){
      group.classList.add('is-open');
      button.setAttribute('aria-expanded','true');
    }
  });

  list.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click',()=>{
      if(window.matchMedia('(max-width:920px)').matches)closeAll();
    });
  });
});

side.dataset.wsMobileNavReady='true';

document.addEventListener('click',event=>{
  if(window.matchMedia('(max-width:920px)').matches&&!side.contains(event.target))closeAll();
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeAll();
});
})();
