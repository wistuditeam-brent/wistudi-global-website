(()=>{
  'use strict';

  const ROOT = '/assets/images/resources/events/communicative-esl-flow/';

  const hero = document.querySelector('.hero-banner');
  if (hero) {
    hero.src = ROOT + 'event-banner.webp';
    hero.removeAttribute('srcset');
    hero.decoding = 'async';
    hero.alt = 'Building a Communicative ESL Lesson with Flow — live workshop for ESL teachers with Trainer Nadia';
  }

  const trainer = document.querySelector('.trainer-photo > img');
  if (trainer) {
    trainer.src = ROOT + 'trainer-nadia.webp';
    trainer.removeAttribute('srcset');
    trainer.decoding = 'async';
    trainer.alt = 'Trainer Nadia, Course Manager at HTA-VN';
  }

  // The supplied Nadia image already contains the name and role treatment.
  const duplicateTrainerTag = document.querySelector('.trainer-photo .trainer-tag');
  if (duplicateTrainerTag) duplicateTrainerTag.remove();

  const style = document.createElement('style');
  style.id = 'event-media-component-css';
  style.textContent = `
    .hero-banner{
      aspect-ratio:1202/675;
      object-fit:cover;
      object-position:center;
    }
    .trainer-photo>img{
      aspect-ratio:434/424;
      object-fit:cover;
      object-position:center;
    }
  `;
  document.head.appendChild(style);
})();