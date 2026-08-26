(() => {
  const path = location.pathname.toLowerCase();
  if (path.includes('/contact')) return;
  if (document.documentElement.dataset.wsRoleGuideReady === 'true') return;
  document.documentElement.dataset.wsRoleGuideReady = 'true';

  const ROLES = {
    teacher: { label: 'Teacher', avatar: '/assets/images/guide-teacher.svg' },
    trainer: { label: 'Trainer', avatar: '/assets/images/guide-trainer.svg' },
    publisher: { label: 'Publisher', avatar: '/assets/images/guide-publisher.svg' },
    organisation: { label: 'Organisation', avatar: '/assets/images/guide-organisation.svg' }
  };

  const TIP_COPY = {
    hero: {
      teacher: 'Think about a lesson you already teach well. Wistudi is most useful when you keep that teaching logic, but stop scattering it across slides, videos, worksheets and separate quiz tools.',
      trainer: 'Picture your next workshop: a short explanation, something people respond to, a practical task and a takeaway afterwards. Wistudi is designed to keep that whole sequence together.',
      publisher: 'Think beyond publishing a page. A topic can become something people watch, explore, answer, practise and print — while still belonging to the same piece of content.',
      organisation: 'The useful question here is not “what tool does this replace?” but “how many disconnected learning steps could we bring into one governed environment?”'
    },
    core: {
      teacher: 'A simple classroom use case: build Monday’s lesson, share the self-paced version for absent learners, then reuse the same material for revision later instead of rebuilding it.',
      trainer: 'For recurring training, this is where the time saving adds up. Build the learning sequence once, then adapt the examples or audience without rebuilding the delivery every time.',
      publisher: 'If you already have good educational content, treat these capabilities as the layers around it — interaction, delivery, tracking and reuse — rather than starting from a blank canvas.',
      organisation: 'This becomes useful when different teams need the same standards but not identical content. Keep a common publishing structure while allowing departments to adapt what they deliver.'
    },
    connected: {
      teacher: 'Imagine teaching without the “open this tab, now open that PDF” routine. The value here is the handoff between moments in the lesson, not just the individual tools.',
      trainer: 'A workshop feels much smoother when the activity, video, reflection and follow-up sit in one journey. That matters more to learners than how many features are underneath it.',
      publisher: 'This is where a content library can become a learning product. The pieces stay connected, so the experience feels intentionally authored rather than assembled from links.',
      organisation: 'The operational win is fewer handoffs between systems. That can mean less duplicated setup, clearer ownership and a more consistent learner experience across teams.'
    },
    formats: {
      teacher: 'Say half your class is online and half needs printed practice. You should not have to author two lessons. Build the learning once, then choose the format that fits the moment.',
      trainer: 'For a live workshop, you might use the interactive version on screen and hand out the printable version for group work or follow-up. Same learning idea, different delivery moment.',
      publisher: 'A strong publishing opportunity is to release one title in several useful forms — interactive, video-led and printable — without treating each format as a separate product build.',
      organisation: 'This is especially useful across mixed environments: office training, classrooms, remote learners and low-connectivity settings can all use versions of the same governed content.'
    },
    xpvideo: {
      teacher: 'Try using a checkpoint just before you would normally pause a classroom video and ask a question. The learner has to do something with what they watched before moving on.',
      trainer: 'A compliance or onboarding video becomes more useful when people must make a choice, answer a scenario or reflect at the exact point it matters — not in a quiz ten minutes later.',
      publisher: 'If video is part of your catalogue, checkpoints can turn passive viewing into authored learning. You are publishing the interaction around the video, not only the video itself.',
      organisation: 'For organisation-wide video learning, checkpoints give you a clearer signal than completion alone. You can see whether people interacted with the key moments, not just pressed play.'
    },
    flows: {
      teacher: 'This could be tomorrow’s lesson: introduce the topic, show something, check understanding, let students practise, then finish with reflection. A Flow simply keeps that teaching sequence together.',
      trainer: 'Think of a Flow as your workshop run-sheet becoming interactive. Content, activity, discussion prompts and assessment can follow the same order you already facilitate in person.',
      publisher: 'A Flow is useful when a chapter or topic needs progression. Instead of publishing a collection of assets, you can publish the route a learner should take through them.',
      organisation: 'Flows give teams a repeatable structure. That is useful when you want consistent learning journeys across regions or departments without forcing everyone into identical content.'
    },
    printable: {
      teacher: 'A practical example: run the interactive activity together, then print the same learning as independent practice or homework. Students recognise the content instead of meeting a disconnected worksheet.',
      trainer: 'Use the interactive version during the workshop and the worksheet as the table activity, workbook page or takeaway afterwards. You do not need to recreate the exercise in another tool.',
      publisher: 'This is where digital-first content can still serve schools, books, workbooks and blended programmes. The printable output becomes another expression of the same authored learning.',
      organisation: 'Printable output is useful when delivery conditions vary. The same approved learning can continue in classrooms, field locations or low-connectivity environments without a parallel authoring workflow.'
    },
    scale: {
      teacher: 'You do not need to begin by building a course. Start with one lesson you use often. Once that works, duplicate the pattern and gradually build a reusable teaching library.',
      trainer: 'Start with one repeatable programme — onboarding is a good example — then turn the strongest pieces into templates for other teams or cohorts.',
      publisher: 'This is where a few successful resources can grow into a catalogue. Reusable structures make it easier to publish a series without every new title feeling like a fresh production project.',
      organisation: 'Scaling is less about making one giant course and more about repeatable governance: templates, shared resources and consistent publishing patterns that multiple teams can use.'
    },
    social: {
      teacher: 'A lesson can keep going after the activity ends. Use the social layer for questions, sharing examples or peer discussion rather than sending the class into a separate communication tool.',
      trainer: 'For cohort-based training, this is useful between sessions. Learners can continue the conversation, compare examples and stay connected without the programme disappearing after the workshop.',
      publisher: 'Publishing does not have to end at distribution. A social layer gives your audience somewhere to respond to, discuss and return to the learning you release.',
      organisation: 'Communities can sit around programmes, departments or professional interests. That gives formal learning a place to continue without turning the platform into only an LMS catalogue.'
    },
    dashboard: {
      teacher: 'This is the “what happened after I assigned it?” part. Instead of guessing who completed the work, you can return to one place and see learning, progress and what you are building.',
      trainer: 'After a programme, this is where you check participation and results before deciding what needs another session, a follow-up activity or a different explanation next time.',
      publisher: 'Use this as your publishing home base: what you have released, what you are still building and what people are engaging with can sit closer together.',
      organisation: 'For teams, the dashboard becomes an operational view rather than just a learner homepage — useful for seeing activity across content, users and workspaces.'
    },
    integrations: {
      teacher: 'You do not need to understand the integration plumbing. The practical benefit is that Wistudi can fit around the systems your school already expects you to use.',
      trainer: 'If your clients already use an LMS, the goal is not to force a replacement conversation. Wistudi can be the richer publishing layer while the existing system keeps doing its job.',
      publisher: 'This matters when your content needs to travel. A modular architecture gives you more options for getting published learning into the environments your customers already use.',
      organisation: 'This is the section to think about fit, not features. Keep the systems that already work, then use Wistudi where you need stronger publishing, interaction or cross-format delivery.'
    },
    blocks: {
      teacher: 'Pick blocks the way you would pick teaching techniques. A quick poll can open the lesson, sorting can check understanding, and reflection can close it. The combination is the lesson.',
      trainer: 'You can use different blocks for different energy levels in a session: a fast response early, a scenario in the middle, then reflection or written work when you want deeper thinking.',
      publisher: 'Blocks are useful as an authoring vocabulary. Once you know what each one does, you can design richer learning without inventing a new interaction pattern for every page.',
      organisation: 'A native block library helps standardise quality. Teams can create varied learning while still working inside a controlled set of interaction patterns.'
    },
    live: {
      teacher: 'This is useful when the screen is part of the room. Put the Flow on the classroom display, explain visually, then move straight into an activity without leaving the lesson.',
      trainer: 'For facilitation, use the live tools when you want the group looking at the same thing at the same moment — sketch an idea, collect input, then continue the training sequence.',
      publisher: 'Live delivery gives published content another life. A resource can support an instructor-led session as well as independent use, which broadens how the same material can be used.',
      organisation: 'This supports blended delivery where some learning is self-paced and some is facilitated. The important part is keeping both modes inside the same content ecosystem.'
    },
    analytics: {
      teacher: 'Look for patterns, not just scores. If half the class stalls on the same activity, that is a useful teaching signal for what you need to revisit next.',
      trainer: 'Use results to improve the next cohort. A weak checkpoint may mean the explanation needs work, while a strong one may be something you can shorten next time.',
      publisher: 'Performance data can tell you which parts of a learning product are doing the work. That is useful when deciding what to revise, expand or reuse in another title.',
      organisation: 'At scale, the value is trend visibility: where participation drops, where outcomes differ and which programmes deserve attention rather than relying only on completion counts.'
    },
    organisation: {
      teacher: 'If you work inside a school or academy, the benefit is shared structure without losing your own teaching style. You can work independently while still contributing to a larger learning library.',
      trainer: 'For a training team, shared workspaces make it easier to keep programmes consistent while different facilitators adapt examples for their own groups.',
      publisher: 'An organisation workspace can separate personal publishing from team publishing, which is useful when several people contribute to the same catalogue or curriculum.',
      organisation: 'Think about governance here: who can create, who can publish, what stays private and what can be shared. That is often more important than adding another authoring feature.'
    },
    partners: {
      teacher: 'The practical value of partnerships is simple: more useful tools and content can become available without asking you to learn a completely separate teaching workflow each time.',
      trainer: 'Specialist partner tools can add capability when a programme needs it, while the overall learner journey stays coherent rather than becoming a list of external links.',
      publisher: 'Partnerships can widen what your content can do without forcing you to build every specialist technology yourself. That leaves the publishing experience at the centre.',
      organisation: 'This matters when evaluating long-term fit. A platform that can work with specialist providers is easier to extend than one that tries to own every part of the stack.'
    },
    why: {
      teacher: 'The simplest test is whether this removes friction from a real lesson you already teach. If it saves setup, keeps learners focused and gives you another delivery option, that is the useful part.',
      trainer: 'Judge this against a real programme you run today. Count how many files, links and tools you currently manage, then imagine which of those handoffs could disappear.',
      publisher: 'The opportunity is not “more features”. It is being able to publish richer learning products without maintaining a different production workflow for every format.',
      organisation: 'A good evaluation question is where fragmentation currently costs you time: authoring, distribution, reporting, integrations or maintaining multiple versions of the same learning.'
    },
    audience: {
      teacher: 'You can start small. One teacher account and one strong lesson is enough to understand whether the workflow fits before anyone talks about scaling it across a school.',
      trainer: 'A single facilitator can use the same model that a larger training department uses later. That makes it easier to prove the workflow before introducing team governance.',
      publisher: 'Independent publishing and organisation publishing do not have to be separate worlds. You can begin with your own catalogue and grow into a larger team structure later.',
      organisation: 'You do not need to design the final enterprise structure on day one. Start with one team or programme, learn what governance is actually needed, then expand from evidence.'
    },
    default: {
      teacher: 'Try relating this section to one lesson you already teach. The useful question is: where would it remove setup, keep learners engaged or let you reuse the same work in another way?',
      trainer: 'Picture one real programme you deliver. This section matters if it helps you reduce handoffs, improve participation or reuse the same training more effectively next time.',
      publisher: 'Think of this as part of the publishing workflow rather than another isolated feature. Ask how it could make your content richer, easier to distribute or easier to reuse.',
      organisation: 'The useful lens here is operational: would this make learning easier to govern, distribute, reuse or understand across multiple teams and audiences?'
    }
  };

  const roleStorage = 'wistudiGuideRole';
  const seenStorage = 'wistudiGuideSeen';
  const minimizedStorage = 'wistudiGuideMinimized';
  let role = localStorage.getItem(roleStorage);
  if (!ROLES[role]) role = '';
  let minimized = sessionStorage.getItem(minimizedStorage) === '1';
  let seen = new Set();
  try { seen = new Set(JSON.parse(sessionStorage.getItem(seenStorage) || '[]')); } catch (_) {}
  let activeSection = null;
  let desktopBubble = null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMQ = window.matchMedia('(max-width: 760px)');

  const style = document.createElement('style');
  style.id = 'ws-role-guide-style';
  style.textContent = `
    .ws-guide-section{position:relative!important}
    .ws-role-guide-anchor{position:absolute;right:clamp(18px,4vw,56px);bottom:24px;z-index:35;display:flex;align-items:flex-end;gap:8px;transition:right .28s ease,opacity .22s ease,transform .22s ease}
    .ws-role-guide-trigger{position:relative;width:62px;height:62px;border-radius:50%;padding:0;border:2px solid rgba(255,255,255,.96);background:#fff;box-shadow:0 10px 30px rgba(42,26,78,.18);cursor:pointer;display:grid;place-items:center;transition:transform .2s ease,box-shadow .22s ease;overflow:visible}
    .ws-role-guide-trigger img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover;background:#efe8ff}
    .ws-role-guide-trigger:hover{transform:translateY(-2px) scale(1.035);box-shadow:0 14px 34px rgba(42,26,78,.24)}
    .ws-role-guide-trigger::after{content:'Tip';position:absolute;right:48px;bottom:2px;min-width:max-content;padding:6px 9px;border-radius:999px;background:#fff;color:#6d28d9;border:1px solid rgba(124,58,237,.16);font:800 11px/1 Inter,sans-serif;box-shadow:0 8px 20px rgba(42,26,78,.10);opacity:0;transform:translateX(5px);transition:.2s ease;pointer-events:none}
    .ws-role-guide-anchor.is-new .ws-role-guide-trigger::before{content:'';position:absolute;inset:-9px;border-radius:50%;border:2px solid rgba(249,115,22,.62);box-shadow:0 0 0 5px rgba(249,115,22,.10),0 0 24px rgba(249,115,22,.48);animation:wsGuideAura 2s ease-in-out infinite;pointer-events:none}
    .ws-role-guide-anchor.is-new .ws-role-guide-trigger::after{content:'New tip';opacity:1;transform:none;color:#c2410c;border-color:rgba(249,115,22,.24)}
    .ws-role-guide-anchor.is-chooser .ws-role-guide-trigger::after{content:'Choose your view';opacity:1;transform:none}
    .ws-role-guide-anchor.is-minimized .ws-role-guide-trigger{width:34px;height:34px;border:1px solid rgba(124,58,237,.18);background:#fff;box-shadow:0 6px 18px rgba(42,26,78,.11);overflow:hidden}
    .ws-role-guide-anchor.is-minimized .ws-role-guide-trigger img{display:none}
    .ws-role-guide-anchor.is-minimized .ws-role-guide-trigger::before{content:'✦';position:static;display:block;color:#7c3aed;font-size:15px;border:0;box-shadow:none;animation:none}
    .ws-role-guide-anchor.is-minimized .ws-role-guide-trigger::after{content:'Show tips';right:28px;bottom:0}
    .ws-role-guide-anchor.is-minimized:hover .ws-role-guide-trigger::after{opacity:1;transform:none}
    .ws-role-guide-bubble{position:absolute;right:0;bottom:78px;width:min(385px,calc(100vw - 40px));background:rgba(255,255,255,.98);border:1px solid rgba(124,58,237,.14);border-radius:22px;box-shadow:0 24px 70px rgba(34,24,64,.20);padding:18px;transform-origin:calc(100% - 28px) 100%;opacity:0;transform:translateY(8px) scale(.96);pointer-events:none;transition:opacity .22s ease,transform .28s cubic-bezier(.2,.75,.25,1);backdrop-filter:blur(14px);color:#201a2a}
    .ws-role-guide-bubble.is-open{opacity:1;transform:none;pointer-events:auto}
    .ws-role-guide-bubble::after{content:'';position:absolute;right:24px;bottom:-8px;width:16px;height:16px;background:#fff;border-right:1px solid rgba(124,58,237,.14);border-bottom:1px solid rgba(124,58,237,.14);transform:rotate(45deg)}
    .ws-guide-head{display:grid;grid-template-columns:46px 1fr auto;gap:11px;align-items:center;margin-bottom:14px}
    .ws-guide-head img{width:46px;height:46px;border-radius:50%;background:#efe8ff;border:1px solid rgba(124,58,237,.12)}
    .ws-guide-head strong{display:block;font:800 14px/1.25 'Be Vietnam Pro',Inter,sans-serif;color:#251d31}
    .ws-guide-head span{display:block;margin-top:3px;color:#82798d;font-size:11px;font-weight:650}
    .ws-guide-close{width:32px;height:32px;border:0;border-radius:10px;background:#f6f3f9;color:#61596c;cursor:pointer;font-size:18px;line-height:1}
    .ws-guide-kicker{display:flex;align-items:center;gap:7px;color:#c2410c;font-size:11px;font-weight:850;letter-spacing:.02em;margin:3px 0 8px}
    .ws-guide-kicker i{width:8px;height:8px;border-radius:50%;background:#f97316;box-shadow:0 0 0 4px rgba(249,115,22,.10)}
    .ws-guide-copy{margin:0;color:#51495b;font-size:13.5px;line-height:1.68}
    .ws-guide-role-label{margin-top:16px;padding-top:13px;border-top:1px solid #eee9f2;color:#7a7184;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
    .ws-guide-roles{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px}
    .ws-guide-role{border:1px solid transparent;background:transparent;border-radius:13px;padding:6px 3px 7px;cursor:pointer;color:#6b6375;font-size:9.5px;font-weight:750;text-align:center;transition:.18s ease}
    .ws-guide-role img{display:block;width:36px;height:36px;object-fit:cover;border-radius:50%;margin:0 auto 5px;background:#efe8ff;border:2px solid transparent}
    .ws-guide-role:hover{background:#faf8fd}.ws-guide-role.is-active{background:#f5f0ff;color:#5b21b6;border-color:#e7dcfb}.ws-guide-role.is-active img{border-color:#7c3aed}
    .ws-guide-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:13px}
    .ws-guide-minimize{border:0;background:transparent;padding:5px 0;color:#7a7184;font-size:11px;font-weight:750;cursor:pointer}.ws-guide-minimize:hover{color:#5b21b6}
    .ws-guide-topic{font-size:10.5px;color:#9a92a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
    .ws-guide-mobile-backdrop{position:fixed;inset:0;z-index:12950;background:rgba(18,13,30,.42);opacity:0;pointer-events:none;transition:opacity .2s ease;backdrop-filter:blur(2px)}
    .ws-guide-mobile-sheet{position:fixed;z-index:13000;left:10px;right:10px;bottom:10px;background:#fff;border-radius:24px 24px 18px 18px;box-shadow:0 24px 80px rgba(18,13,30,.30);padding:18px 18px calc(18px + env(safe-area-inset-bottom));transform:translateY(calc(100% + 30px));transition:transform .32s cubic-bezier(.2,.75,.25,1);max-height:min(78vh,620px);overflow:auto;color:#201a2a}
    .ws-guide-mobile-sheet::before{content:'';display:block;width:42px;height:4px;border-radius:99px;background:#d8d2df;margin:-7px auto 12px}
    body.ws-guide-mobile-open .ws-guide-mobile-backdrop{opacity:1;pointer-events:auto}
    body.ws-guide-mobile-open .ws-guide-mobile-sheet{transform:none}
    body.ws-guide-video-floating .ws-role-guide-anchor{right:clamp(365px,35vw,465px)}
    @keyframes wsGuideAura{0%,100%{opacity:.45;transform:scale(.92)}50%{opacity:1;transform:scale(1.05)}}
    @media(max-width:760px){
      .ws-role-guide-anchor{right:14px;bottom:15px;z-index:30}
      .ws-role-guide-trigger{width:52px;height:52px}
      .ws-role-guide-trigger::after{right:42px;font-size:10px;padding:5px 8px}
      .ws-role-guide-bubble{display:none!important}
      body.ws-guide-video-floating .ws-role-guide-anchor{right:14px}
      .ws-guide-roles{gap:5px}.ws-guide-role img{width:40px;height:40px}.ws-guide-role{font-size:10px}
      .ws-guide-copy{font-size:14px;line-height:1.65}
    }
    @media(prefers-reduced-motion:reduce){.ws-role-guide-anchor,.ws-role-guide-trigger,.ws-role-guide-trigger::before,.ws-role-guide-bubble,.ws-guide-mobile-backdrop,.ws-guide-mobile-sheet{animation:none!important;transition-duration:.01ms!important}}
  `;
  document.head.appendChild(style);

  const mobileBackdrop = document.createElement('div');
  mobileBackdrop.className = 'ws-guide-mobile-backdrop';
  const mobileSheet = document.createElement('div');
  mobileSheet.className = 'ws-guide-mobile-sheet';
  mobileSheet.setAttribute('role', 'dialog');
  mobileSheet.setAttribute('aria-modal', 'true');
  mobileSheet.setAttribute('aria-label', 'Wistudi perspective tip');
  document.body.append(mobileBackdrop, mobileSheet);

  const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const sectionTopic = section => {
    const id = (section.id || '').toLowerCase();
    const heading = (section.querySelector('h1,h2,h3')?.textContent || '').toLowerCase();
    const eyebrow = (section.querySelector('.eyebrow,.capabilities-kicker,.section-kicker,.int-kicker')?.textContent || '').toLowerCase();
    const text = `${id} ${heading} ${eyebrow}`;
    if (section.classList.contains('hero')) return 'hero';
    if (/xp.?video/.test(text)) return 'xpvideo';
    if (/flow/.test(text)) return 'flows';
    if (/print|worksheet|screen to desk|screen.*desk/.test(text)) return 'printable';
    if (/format/.test(text)) return 'formats';
    if (/block|activit/.test(text)) return 'blocks';
    if (/whiteboard|live teach|classroom|workshop/.test(text)) return 'live';
    if (/discover|dashboard|workspace/.test(text)) return 'dashboard';
    if (/analytic|report|track|insight|measure/.test(text)) return 'analytics';
    if (/integrat|architecture|lti|sso|moodle|canvas|modular|expand/.test(text)) return 'integrations';
    if (/partner|ecosystem|technology/.test(text)) return 'partners';
    if (/social|community|connect/.test(text)) return 'social';
    if (/scale|catalog|catalogue|library/.test(text)) return 'scale';
    if (/organisation|organization|team|govern|private/.test(text)) return 'organisation';
    if (/why wistudi|traditional|separate systems|problems/.test(text)) return 'why';
    if (/built for every|audience|publisher.*organisation|publisher.*organization/.test(text)) return 'audience';
    if (/core|everything you need|create.*publish|platform overview/.test(text)) return 'core';
    if (/connected|all in one|separate tools/.test(text)) return 'connected';
    return 'default';
  };

  const roleButtons = () => Object.entries(ROLES).map(([key, data]) => `
    <button class="ws-guide-role ${role === key ? 'is-active' : ''}" type="button" data-guide-role="${key}" aria-pressed="${role === key}">
      <img src="${data.avatar}" alt="" aria-hidden="true"><span>${data.label}</span>
    </button>`).join('');

  const renderPanel = (section, chooser = false) => {
    const heading = section.querySelector('h1,h2,h3')?.textContent?.trim() || 'this section';
    const topic = sectionTopic(section);
    const selected = role && ROLES[role] ? ROLES[role] : ROLES.teacher;
    const copy = chooser && !role
      ? 'Choose the perspective that is closest to your work. The page stays the same — the guide simply gives you practical examples for each section.'
      : (TIP_COPY[topic]?.[role] || TIP_COPY.default[role || 'teacher']);
    const kicker = chooser && !role ? 'Make the site more relevant to you' : 'Here’s one way you could use this';
    return `
      <div class="ws-guide-head">
        <img src="${selected.avatar}" alt="${escapeHtml(selected.label)} guide avatar">
        <div><strong>${role ? `${escapeHtml(selected.label)} perspective` : 'Choose your perspective'}</strong><span>${role ? 'Practical ideas for this section' : 'You can switch at any time'}</span></div>
        <button class="ws-guide-close" type="button" data-guide-close aria-label="Close tip">×</button>
      </div>
      <div class="ws-guide-kicker"><i></i>${escapeHtml(kicker)}</div>
      <p class="ws-guide-copy">${escapeHtml(copy)}</p>
      <div class="ws-guide-role-label">Switch perspective</div>
      <div class="ws-guide-roles">${roleButtons()}</div>
      <div class="ws-guide-actions">
        <button class="ws-guide-minimize" type="button" data-guide-minimize>${minimized ? 'Show full guide' : 'Minimise guide'}</button>
        <span class="ws-guide-topic">${escapeHtml(heading)}</span>
      </div>`;
  };

  const markSeen = section => {
    const key = section.dataset.wsGuideKey;
    if (!key) return;
    seen.add(key);
    sessionStorage.setItem(seenStorage, JSON.stringify([...seen]));
    section.querySelector('.ws-role-guide-anchor')?.classList.remove('is-new');
  };

  const syncRoleAcrossAnchors = () => {
    document.querySelectorAll('.ws-role-guide-trigger img').forEach(img => {
      if (role && ROLES[role]) img.src = ROLES[role].avatar;
    });
    document.querySelectorAll('.ws-role-guide-anchor').forEach(anchor => {
      anchor.classList.toggle('is-chooser', !role);
      anchor.classList.toggle('is-minimized', minimized);
    });
  };

  const closeGuide = () => {
    document.body.classList.remove('ws-guide-mobile-open');
    if (desktopBubble) {
      desktopBubble.classList.remove('is-open');
      setTimeout(() => {
        if (desktopBubble && !desktopBubble.classList.contains('is-open')) {
          desktopBubble.remove();
          desktopBubble = null;
        }
      }, reduced ? 5 : 240);
    }
  };

  const wirePanel = (root, section) => {
    root.querySelector('[data-guide-close]')?.addEventListener('click', closeGuide);
    root.querySelector('[data-guide-minimize]')?.addEventListener('click', () => {
      minimized = !minimized;
      sessionStorage.setItem(minimizedStorage, minimized ? '1' : '0');
      closeGuide();
      syncRoleAcrossAnchors();
    });
    root.querySelectorAll('[data-guide-role]').forEach(btn => btn.addEventListener('click', () => {
      const next = btn.dataset.guideRole;
      if (!ROLES[next]) return;
      role = next;
      localStorage.setItem(roleStorage, role);
      minimized = false;
      sessionStorage.setItem(minimizedStorage, '0');
      syncRoleAcrossAnchors();
      if (mobileMQ.matches) {
        mobileSheet.innerHTML = renderPanel(section, false);
        wirePanel(mobileSheet, section);
      } else if (desktopBubble) {
        desktopBubble.innerHTML = renderPanel(section, false);
        wirePanel(desktopBubble, section);
        requestAnimationFrame(() => desktopBubble?.classList.add('is-open'));
      }
    }));
  };

  const openGuide = (section, chooser = false) => {
    if (!section) return;
    activeSection = section;
    if (minimized) {
      minimized = false;
      sessionStorage.setItem(minimizedStorage, '0');
      syncRoleAcrossAnchors();
    }
    markSeen(section);
    if (mobileMQ.matches) {
      mobileSheet.innerHTML = renderPanel(section, chooser);
      wirePanel(mobileSheet, section);
      document.body.classList.add('ws-guide-mobile-open');
      return;
    }
    closeGuide();
    const anchor = section.querySelector('.ws-role-guide-anchor');
    if (!anchor) return;
    desktopBubble = document.createElement('div');
    desktopBubble.className = 'ws-role-guide-bubble';
    desktopBubble.setAttribute('role', 'dialog');
    desktopBubble.setAttribute('aria-label', 'Wistudi perspective tip');
    desktopBubble.innerHTML = renderPanel(section, chooser);
    anchor.appendChild(desktopBubble);
    wirePanel(desktopBubble, section);
    requestAnimationFrame(() => desktopBubble?.classList.add('is-open'));
  };

  mobileBackdrop.addEventListener('click', closeGuide);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGuide(); });

  const main = document.querySelector('main');
  if (!main) return;
  const sections = [...main.querySelectorAll(':scope > section')].filter(section => {
    const rect = section.getBoundingClientRect();
    if (rect.height < 250) return false;
    if (section.matches('[hidden],.ws-no-role-guide')) return false;
    return true;
  });

  sections.forEach((section, index) => {
    section.classList.add('ws-guide-section');
    const heading = section.querySelector('h1,h2,h3')?.textContent || `section-${index + 1}`;
    const key = `${path}:${section.id || slug(heading)}`;
    section.dataset.wsGuideKey = key;
    const anchor = document.createElement('div');
    anchor.className = 'ws-role-guide-anchor';
    if (!role) anchor.classList.add('is-chooser');
    if (minimized) anchor.classList.add('is-minimized');
    if (!seen.has(key) && role && !minimized) anchor.classList.add('is-new');
    const currentRole = role && ROLES[role] ? ROLES[role] : ROLES.teacher;
    anchor.innerHTML = `<button class="ws-role-guide-trigger" type="button" aria-label="${role ? `Open ${currentRole.label} tip` : 'Choose your perspective'}"><img src="${currentRole.avatar}" alt="" aria-hidden="true"></button>`;
    anchor.querySelector('button').addEventListener('click', () => openGuide(section, !role));
    section.appendChild(anchor);
  });

  syncRoleAcrossAnchors();

  if ('IntersectionObserver' in window) {
    let lastActive = null;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      const section = visible[0].target;
      if (section === lastActive) return;
      lastActive = section;
      document.querySelectorAll('.ws-role-guide-anchor.is-current').forEach(a => a.classList.remove('is-current'));
      const anchor = section.querySelector('.ws-role-guide-anchor');
      anchor?.classList.add('is-current');
      if (role && !minimized && !seen.has(section.dataset.wsGuideKey)) anchor?.classList.add('is-new');
    }, { threshold: [0.18, 0.34, 0.5, 0.66], rootMargin: '-12% 0px -18% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  const syncVideoConflict = () => {
    const floater = document.querySelector('.ws-hero-float-shell');
    document.body.classList.toggle('ws-guide-video-floating', !!floater?.classList.contains('is-visible'));
  };
  const watchHeroFloater = () => {
    const floater = document.querySelector('.ws-hero-float-shell');
    if (!floater) {
      setTimeout(watchHeroFloater, 500);
      return;
    }
    syncVideoConflict();
    new MutationObserver(syncVideoConflict).observe(floater, { attributes: true, attributeFilter: ['class'] });
  };
  watchHeroFloater();

  if (!role && sections[0] && !mobileMQ.matches) {
    setTimeout(() => openGuide(sections[0], true), reduced ? 10 : 850);
  }
})();
