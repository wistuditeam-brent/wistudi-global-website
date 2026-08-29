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
      imageDiscover.video=BASE+'videos/IMAGE%20DISCOVERY%20-%20VIDEO.mp4';
      imageDiscover.worksheet=BASE+'worksheets/IMAGE%20DISCOVERY%20-%20WS.png';
    }

    const fillBlanks=activities[3];
    if(fillBlanks){
      fillBlanks.key='fill-blanks';
      fillBlanks.label='Fill in the Blanks';
      fillBlanks.video=BASE+'videos/FILL%20IN%20THE%20BLANKS%20-%20VIDEO.mp4';
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

    if(!doc.getElementById('ws-interactive-printable-framing-fix')){
      const style=doc.createElement('style');
      style.id='ws-interactive-printable-framing-fix';
      style.textContent=`
        #printable .ws-transform-tabs{
          scroll-snap-type:x proximity;
          overscroll-behavior-inline:contain;
          -webkit-overflow-scrolling:touch;
        }
        #printable .ws-transform-tab,
        #printable .ws-transform-more{scroll-snap-align:center}
        #printable .ws-transform-stage{touch-action:pan-y}
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
        #printable .ws-transform-paper-foreground{inset:2.8%!important}
        #printable .ws-transform-paper-image{
          object-fit:contain!important;
          object-position:center center!important;
        }
        @media(max-width:700px){
          #printable .ws-transform-shell{width:100%!important;padding-inline:0!important}
          #printable .ws-transform-tabs{
            width:100%!important;
            max-width:100%!important;
            justify-content:flex-start!important;
            padding:5px!important;
            scroll-padding-inline:10px;
          }
          #printable .ws-transform-stage-wrap{width:100%!important;max-width:100%!important}
          #printable .ws-transform-stage{
            width:100%!important;
            aspect-ratio:16/10!important;
            border-radius:18px!important;
          }
          #printable .ws-transform-media{padding:8px!important}
          #printable .ws-transform-video{border-radius:14px!important}
          #printable .ws-transform-media::after{inset:8px!important;border-radius:14px!important}
          #printable .ws-transform-paper-foreground{inset:8px!important}
          #printable .ws-transform-paper-image{max-width:100%!important;max-height:100%!important;border-radius:9px!important}
          #printable .ws-transform-handle{width:46px!important;height:46px!important;touch-action:none!important}
          #printable .ws-transform-label{display:none!important}
          #printable .ws-transform-caption{padding-inline:6px!important;line-height:1.45!important}
          #printable .ws-transform-caption .dot{display:none!important}
          #printable .ws-transform-range-note{padding-inline:10px!important;line-height:1.5!important}
        }
      `;
      doc.head.appendChild(style);
    }

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
