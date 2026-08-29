(()=>{
  'use strict';

  const doc=document;
  if(!doc.body?.classList.contains('page-platform')) return;

  const apply=()=>{
    const api=window.WistudiInteractivePrintableSlider;
    const stage=doc.querySelector('#printable .ws-transform-stage');
    const tabs=doc.querySelector('#printable .ws-transform-tabs');
    if(!api||!stage||!tabs||!Array.isArray(api.activities)) return false;

    const BASE='/assets/media/interactive-printable/';
    const activities=api.activities;

    const imageDiscover=activities[2];
    if(imageDiscover){
      imageDiscover.key='image-discover';
      imageDiscover.label='Image Discover';
      // The uploaded third video is currently stored under the old Written Response filename.
      // Its showcase role is Image Discover; keep the file in place and correct the mapping here.
      imageDiscover.video=BASE+'videos/WRITTEN%20RESPONSE%20-%20VIDEO.mp4';
      imageDiscover.worksheet=BASE+'worksheets/IMAGE%20DISCOVERY%20-%20WS.png';
    }

    const fillBlanks=activities[3];
    if(fillBlanks){
      fillBlanks.key='fill-blanks';
      fillBlanks.label='Fill in the Blanks';
      fillBlanks.video=BASE+'videos/FILL%20IN%20THE%20BLANKS%20-%20VIDEO.mp4';
      // The remaining uploaded worksheet is the Fill in the Blanks sheet; the previous build
      // incorrectly paired this tab with the Image Discovery worksheet.
      fillBlanks.worksheet=BASE+'worksheets/WRITTEN%20RESPONSE%20-%20WS.png';
    }

    const oldImageTab=tabs.querySelector('[data-activity="written-response"]');
    if(oldImageTab){
      oldImageTab.dataset.activity='image-discover';
      const label=oldImageTab.querySelector('span');
      if(label) label.textContent='Image Discover';
      const svg=oldImageTab.querySelector('svg');
      if(svg) svg.innerHTML='<path d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z"/><circle cx="12" cy="12" r="2.4"/>';
    }

    const fillTab=tabs.querySelector('[data-activity="fill-blanks"]');
    if(fillTab){
      const label=fillTab.querySelector('span');
      if(label) label.textContent='Fill in the Blanks';
    }

    const style=doc.createElement('style');
    style.id='ws-interactive-printable-framing-fix';
    style.textContent=`
      #printable .ws-transform-media{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        background:linear-gradient(135deg,#f3effa 0%,#fbfaff 48%,#f7f3fb 100%)!important;
      }
      #printable .ws-transform-video{
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center center!important;
        border-radius:22px!important;
        background:#fff!important;
        box-shadow:0 22px 54px rgba(52,35,82,.17),0 5px 16px rgba(52,35,82,.08)!important;
      }
      #printable .ws-transform-media::after{
        inset:14px!important;
        border-radius:22px!important;
        background:linear-gradient(180deg,rgba(255,255,255,.08),transparent 17%,transparent 82%,rgba(33,19,54,.035))!important;
      }
      #printable .ws-transform-paper-foreground{
        inset:2.8%!important;
      }
      #printable .ws-transform-paper-image{
        object-fit:contain!important;
        object-position:center center!important;
      }
      @media(max-width:700px){
        #printable .ws-transform-media{padding:8px!important}
        #printable .ws-transform-video{border-radius:15px!important}
        #printable .ws-transform-media::after{inset:8px!important;border-radius:15px!important}
      }
    `;
    doc.head.appendChild(style);

    // Re-apply the active example so the corrected mappings take effect immediately.
    const selected=tabs.querySelector('.ws-transform-tab[aria-selected="true"]');
    const key=selected?.dataset.activity||'link-match';
    api.setActivity(key);
    return true;
  };

  if(apply()) return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(apply()||attempts>80) clearInterval(timer);
  },50);
})();
