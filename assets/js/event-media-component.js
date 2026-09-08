(()=>{
  'use strict';

  const EVENT_ROOT = '/resources/events/building-a-communicative-esl-lesson-with-flow/';
  const EVENT_BANNER = EVENT_ROOT + 'WS%20Banner%20(1).png';
  const NADIA_PROFILE = EVENT_ROOT + 'Team%20Introduction%20.png';
  const HTA_LOGO = '/assets/images/resources/events/communicative-esl-flow/hta-logo.webp';

  const hero = document.querySelector('.hero-banner');
  if (hero) {
    hero.src = EVENT_BANNER;
    hero.removeAttribute('srcset');
    hero.decoding = 'async';
    hero.loading = 'eager';
    hero.alt = 'Building a Communicative ESL Lesson with Flow — live workshop for ESL teachers with Trainer Nadia';
  }

  const trainer = document.querySelector('.trainer-photo > img');
  if (trainer) {
    trainer.src = NADIA_PROFILE;
    trainer.removeAttribute('srcset');
    trainer.decoding = 'async';
    trainer.loading = 'lazy';
    trainer.alt = 'Trainer Nadia, Course Manager at HTA-VN';
  }

  const htaLogo = document.querySelector('.hta-box img');
  if (htaLogo) {
    htaLogo.src = HTA_LOGO;
    htaLogo.removeAttribute('srcset');
    htaLogo.decoding = 'async';
    htaLogo.loading = 'lazy';
    htaLogo.alt = 'Happy Teachers Academy';
  }

  const duplicateTrainerTag = document.querySelector('.trainer-photo .trainer-tag');
  if (duplicateTrainerTag) duplicateTrainerTag.remove();

  const style = document.createElement('style');
  style.id = 'event-media-component-css';
  style.textContent = `
    .hero-banner{
      aspect-ratio:1672/941;
      object-fit:cover;
      object-position:center;
    }
    .trainer-photo>img{
      width:100%;
      height:auto;
      object-fit:cover;
      object-position:center;
    }
    .hta-box img{
      width:172px;
      max-width:32%;
      max-height:58px;
      height:auto;
      object-fit:contain;
      object-position:left center;
      background:transparent;
      flex:0 0 auto;
    }
    @media(max-width:620px){
      .hta-box img{
        width:190px;
        max-width:72%;
        max-height:65px;
      }
    }
  `;
  document.head.appendChild(style);
})();