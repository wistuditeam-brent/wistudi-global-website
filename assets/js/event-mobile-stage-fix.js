(()=>{
'use strict';

const EVENT_PATH='/resources/events/building-a-communicative-esl-lesson-with-flow/';
const currentPath=(window.__WS_PREVIEW_PATH||location.pathname||'').replace(/\/index\.html$/,'/');
if(!currentPath.includes(EVENT_PATH)) return;

const LABELS=['Warm-up','Practice','Production','Reflection'];
const labelKey=text=>String(text||'').replace(/\s+/g,' ').trim();
const isStageLabel=el=>el&&LABELS.includes(labelKey(el.textContent));
const isLeafStageLabel=el=>isStageLabel(el)&&![...el.children].some(child=>isStageLabel(child));

const style=document.createElement('style');
style.textContent=`
@media(max-width:700px){
  html,body,.event-page,.event-page main{max-width:100%!important;overflow-x:hidden!important;}
  .ws-mobile-stage-section{max-width:100%!important;overflow-x:hidden!important;}
  .ws-mobile-stage-primary{width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;}
  .ws-mobile-stage-primary>*{min-width:0!important;max-width:100%!important;}
  .ws-mobile-stage-primary img,.ws-mobile-stage-primary svg{max-width:100%!important;}
  .ws-mobile-stage-duplicate{display:none!important;}
}
`;
document.head.appendChild(style);

const stageLabelsWithin=root=>{
  const set=new Set();
  if(!root) return set;
  if(isLeafStageLabel(root)) set.add(labelKey(root.textContent));
  root.querySelectorAll('*').forEach(el=>{if(isLeafStageLabel(el)) set.add(labelKey(el.textContent));});
  return set;
};

const firstAllStageAncestor=node=>{
  let el=node;
  for(let i=0;i<8&&el&&el!==document.body;i++,el=el.parentElement){
    if(stageLabelsWithin(el).size===LABELS.length) return el;
  }
  return null;
};

const duplicateCardFor=node=>{
  let el=node;
  let lastSingle=node;
  for(let i=0;i<7&&el&&el!==document.body;i++,el=el.parentElement){
    const count=stageLabelsWithin(el).size;
    if(count===1) lastSingle=el;
    if(count>1) break;
  }
  return lastSingle;
};

const clearPrevious=()=>{
  document.querySelectorAll('.ws-mobile-stage-duplicate').forEach(el=>{
    el.classList.remove('ws-mobile-stage-duplicate');
    if(el.dataset.wsMobileAriaHidden==='1'){
      el.removeAttribute('aria-hidden');
      delete el.dataset.wsMobileAriaHidden;
    }
  });
  document.querySelectorAll('.ws-mobile-stage-primary').forEach(el=>el.classList.remove('ws-mobile-stage-primary'));
  document.querySelectorAll('.ws-mobile-stage-section').forEach(el=>el.classList.remove('ws-mobile-stage-section'));
};

let raf=0;
const fixMobileStages=()=>{
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{
    clearPrevious();
    if(!matchMedia('(max-width:700px)').matches) return;

    const leaves=[...document.querySelectorAll('body *')].filter(isLeafStageLabel);
    if(leaves.length<LABELS.length) return;

    const groups=[];
    const seen=new Set();
    leaves.forEach(node=>{
      const group=firstAllStageAncestor(node);
      if(group&&!seen.has(group)){
        seen.add(group);
        groups.push(group);
      }
    });
    if(!groups.length) return;

    groups.sort((a,b)=>{
      const ay=a.getBoundingClientRect().top+window.scrollY;
      const by=b.getBoundingClientRect().top+window.scrollY;
      if(Math.abs(ay-by)>2) return ay-by;
      return a.getBoundingClientRect().height-b.getBoundingClientRect().height;
    });

    const primary=groups[0];
    primary.classList.add('ws-mobile-stage-primary');
    const section=primary.closest('section')||primary.parentElement;
    if(section) section.classList.add('ws-mobile-stage-section');

    groups.slice(1).forEach(group=>{
      if(group===primary||group.contains(primary)||primary.contains(group)) return;
      if(section&&!section.contains(group)) return;
      group.classList.add('ws-mobile-stage-duplicate');
      group.setAttribute('aria-hidden','true');
      group.dataset.wsMobileAriaHidden='1';
    });

    leaves.forEach(node=>{
      if(primary.contains(node)) return;
      if(section&&!section.contains(node)) return;
      const card=duplicateCardFor(node);
      if(!card||card===section||card.contains(primary)||primary.contains(card)) return;
      card.classList.add('ws-mobile-stage-duplicate');
      card.setAttribute('aria-hidden','true');
      card.dataset.wsMobileAriaHidden='1';
    });
  });
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fixMobileStages,{once:true});
else fixMobileStages();

window.addEventListener('resize',fixMobileStages,{passive:true});
window.addEventListener('orientationchange',fixMobileStages,{passive:true});
new MutationObserver(fixMobileStages).observe(document.documentElement,{childList:true,subtree:true});
})();
