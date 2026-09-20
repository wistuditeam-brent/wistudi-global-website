// Preview fixtures only. They are not published Events or Wistudi content.
export const events = Object.freeze([
  Object.freeze({
    id: 'demo-workshop-01', slug: 'communicative-esl', status: 'upcoming',
    title: 'Build a communicative English lesson',
    summary: 'Turn a familiar speaking task into a learning sequence your learners can explore, practise and make their own.',
    subject: 'English', topic: 'Speaking', level: 'B1', audience: 'English teachers and tutors',
    trainer: 'Wistudi Trainer', startsAt: '2026-10-01T07:00:00Z', timezone: 'Asia/Ho_Chi_Minh', duration: 60,
    output: 'A reusable communicative lesson outline and one speaking activity.',
    learningOutcomes: ['Adapt a speaking task into a communicative lesson sequence.', 'Design one purposeful speaking activity with support for learners.', 'Plan a short reflection that helps learners notice their progress.'],
    banner: '/assets/images/resources/events/communicative-esl-flow/event-banner.webp',
    format: 'Live online workshop', zoomMode: 'manual-link-preview',
  }),
  Object.freeze({
    id: 'demo-workshop-02', slug: 'worksheet-to-flow', status: 'upcoming',
    title: 'Turn a worksheet into an interactive learning experience',
    summary: 'Keep the useful teaching intent of a worksheet while giving learners meaningful ways to respond and practise.',
    subject: 'English', topic: 'Worksheets', level: 'A2–B1', audience: 'Teachers adapting existing materials',
    trainer: 'Wistudi Trainer', startsAt: '2026-10-08T08:00:00Z', timezone: 'Asia/Ho_Chi_Minh', duration: 60,
    output: 'A worksheet activity plan ready to build as a Flow.',
    learningOutcomes: ['Identify the learning purpose behind a worksheet task.', 'Choose an interaction that supports the task goal.', 'Plan how to adapt the activity for a Wistudi Flow.'],
    banner: '', format: 'Live online workshop', zoomMode: 'not-connected',
  }),
  Object.freeze({
    id: 'demo-workshop-03', slug: 'interactive-video', status: 'upcoming',
    title: 'Design an interactive video lesson',
    summary: 'Plan moments for learners to notice, predict, respond and reflect while watching a video.',
    subject: 'English', topic: 'Interactive video', level: 'B1–B2', audience: 'Teachers and learning designers',
    trainer: 'Wistudi Trainer', startsAt: '2026-10-15T08:00:00Z', timezone: 'Asia/Ho_Chi_Minh', duration: 75,
    output: 'A short interactive video sequence with purposeful learner checkpoints.',
    learningOutcomes: ['Select meaningful pause points in a video.', 'Write questions that prompt learners to notice and respond.', 'Connect video responses to a follow-up learning task.'],
    banner: '', format: 'Live online workshop', zoomMode: 'not-connected',
  }),
]);

// Calendar fixtures model the operational schedule while linking Publisher Studio
// workshops back to their existing event pages. These records are preview data.
export const calendarHosts = Object.freeze([
  Object.freeze({ id: 'host-wistudi', name: 'Wistudi Trainer', role: 'Trainer', timezone: 'Asia/Ho_Chi_Minh' }),
  Object.freeze({ id: 'host-nadia', name: 'Nadia Nguyen', role: 'Trainer', timezone: 'Asia/Ho_Chi_Minh' }),
  Object.freeze({ id: 'host-an', name: 'An Pham', role: 'Trainer', timezone: 'Asia/Ho_Chi_Minh' }),
]);

export const calendarEventTypes = Object.freeze([
  'Workshop', 'Lesson', 'Coaching', 'Office hours', 'Team meeting', 'Hold',
]);

const schedulingExamples = [
  {
    id: 'calendar-demo-speaking-practice', title: 'B1 speaking practice', type: 'Lesson',
    startsAt: '2026-09-21T02:30:00.000Z', duration: 60, timezone: 'Asia/Ho_Chi_Minh',
    hostId: 'host-nadia', hostName: 'Nadia Nguyen', group: 'B1 English cohort',
    participants: [{ id: 'participant-demo', name: 'Mina Tran' }], status: 'confirmed', visibility: 'private',
    source: 'calendar', studioEventId: '', location: { mode: 'online', label: 'Zoom', url: '' },
    resourceUrl: '', notes: 'Practise asking follow-up questions in a short information-gap activity.',
  },
  {
    id: 'calendar-demo-flow-clinic', title: 'Flow build clinic', type: 'Coaching',
    startsAt: '2026-09-22T06:00:00.000Z', duration: 45, timezone: 'Asia/Ho_Chi_Minh',
    hostId: 'host-an', hostName: 'An Pham', group: 'Flow Builders',
    participants: [{ id: 'participant-demo', name: 'Mina Tran' }], status: 'confirmed', visibility: 'private',
    source: 'calendar', studioEventId: '', location: { mode: 'online', label: 'Google Meet', url: '' },
    resourceUrl: '', notes: 'Bring one activity in progress for peer feedback.',
  },
  {
    id: 'calendar-demo-team-planning', title: 'Trainer planning session', type: 'Team meeting',
    startsAt: '2026-09-24T08:00:00.000Z', duration: 45, timezone: 'Asia/Ho_Chi_Minh',
    hostId: 'host-nadia', hostName: 'Nadia Nguyen', group: 'Wistudi local team',
    participants: [], status: 'pending', visibility: 'internal',
    source: 'calendar', studioEventId: '', location: { mode: 'physical', label: 'Hanoi workspace', url: '' },
    resourceUrl: '', notes: 'Confirm the October workshop resources and trainer assignments.',
  },
];

const publisherStudioCalendarEvents = events.map((item, index) => ({
  id: `calendar-studio-${item.id}`,
  title: item.title,
  type: 'Workshop',
  startsAt: item.startsAt,
  duration: item.duration,
  timezone: item.timezone,
  hostId: 'host-wistudi',
  hostName: item.trainer,
  group: 'Publisher Studio',
  participants: [{ id: 'participant-demo', name: 'Studio participant' }],
  status: 'confirmed',
  visibility: 'public',
  source: 'publisher-studio',
  studioEventId: item.id,
  location: { mode: 'online', label: item.zoomMode === 'manual-link-preview' ? 'Online meeting' : 'Meeting link to be added', url: '' },
  resourceUrl: '',
  notes: item.summary,
  colorIndex: index,
}));

export const calendarSeedEvents = Object.freeze([
  ...schedulingExamples.map(Object.freeze),
  ...publisherStudioCalendarEvents.map(Object.freeze),
]);

// Availability blocks keep external calendar titles private by storing only Busy.
export const calendarAvailabilityRules = Object.freeze([
  Object.freeze({ id: 'availability-nadia-mon', hostId: 'host-nadia', weekday: 1, start: '08:30', end: '12:00', label: 'Morning availability' }),
  Object.freeze({ id: 'availability-nadia-wed', hostId: 'host-nadia', weekday: 3, start: '13:00', end: '17:00', label: 'Afternoon availability' }),
  Object.freeze({ id: 'availability-an-tue', hostId: 'host-an', weekday: 2, start: '09:00', end: '16:00', label: 'Teaching hours' }),
  Object.freeze({ id: 'availability-wistudi-thu', hostId: 'host-wistudi', weekday: 4, start: '09:00', end: '17:00', label: 'Studio hours' }),
]);

export const calendarAvailabilityExceptions = Object.freeze([
  Object.freeze({ id: 'busy-demo-01', hostId: 'host-nadia', date: '2026-09-23', start: '09:00', end: '10:00', status: 'external_busy', label: 'Busy · connected calendar' }),
]);

export const workshops = events;
export const workshop = events[0];

export const challenges = Object.freeze([
  Object.freeze({ id: 'demo-challenge-01', workshopId: events[0].id, title: 'Make one speaking activity your own',
    description: 'Adapt the sample lesson for your learners. Include a clear speaking goal, a useful prompt and a moment for reflection.' }),
  Object.freeze({ id: 'demo-challenge-02', workshopId: events[1].id, title: 'Remix one worksheet task',
    description: 'Choose a worksheet task and plan one interactive response that helps learners practise the same skill.' }),
  Object.freeze({ id: 'demo-challenge-03', workshopId: events[2].id, title: 'Add a purposeful video checkpoint',
    description: 'Choose a short video moment and write one question that helps learners think before they continue watching.' }),
]);

export const challenge = challenges[0];

export const resourceSets = Object.freeze({
  [events[0].id]: [
    { id: 'demo-template-01', type: 'template', label: 'Flow template', title: 'From practice to conversation', availableFrom: 'upcoming', publicPreview: true,
      description: 'A five-part outline for a communicative B1 lesson.',
      sections: [ ['Notice', 'Introduce a real situation: two learners are planning a day out. What do they need to decide?'], ['Prepare', 'Collect useful phrases for suggesting, agreeing and disagreeing.'], ['Practise', 'Try a short exchange with a partner using a phrase bank.'], ['Communicate', 'Agree on a plan with a budget and two different preferences.'], ['Reflect', 'Which phrase helped you keep the conversation going? What would you try next time?'] ] },
    { id: 'demo-worksheet-01', type: 'worksheet', label: 'Worksheet', title: 'Plan a day out', availableFrom: 'live', publicPreview: false,
      description: 'A printable-style task brief to pair with the lesson.',
      sections: [ ['Your task', 'Plan a day out together. You have a shared budget of $30 and four hours.'], ['Partner A', 'You enjoy being outdoors. Suggest two activities and explain why.'], ['Partner B', 'You want to try something new. Ask questions before you agree.'], ['Reflect together', 'Write down your plan, one compromise and one phrase you would use again.'] ] },
    { id: 'demo-guide-01', type: 'guide', label: 'Planning guide', title: 'Give every activity a purpose', availableFrom: 'post_session', publicPreview: false,
      description: 'A short checklist for designing a teaching sequence.',
      sections: [ ['Learning goal', 'What should learners be able to do by the end?'], ['Support', 'What language or examples do they need first?'], ['Choice', 'Where do learners make a meaningful decision?'], ['Evidence', 'How will you know they can use what they have learned?'] ] },
  ],
  [events[1].id]: [
    { id: 'demo-template-02', type: 'template', label: 'Flow template', title: 'Worksheet to interactive Flow', availableFrom: 'upcoming', publicPreview: true,
      description: 'A planning pattern for adapting a familiar paper activity.',
      sections: [ ['Keep the goal', 'Identify the skill or knowledge the worksheet is meant to practise.'], ['Find the learner action', 'Decide what learners should do, choose or explain.'], ['Add interaction', 'Choose a response type that fits the goal.'], ['Check the learning', 'Add a prompt that helps learners review their thinking.'] ] },
    { id: 'demo-guide-02', type: 'guide', label: 'Adaptation guide', title: 'A worksheet adaptation checklist', availableFrom: 'post_session', publicPreview: false,
      description: 'Questions to ask before moving a task from paper to screen.',
      sections: [ ['Purpose', 'What does the paper version already do well?'], ['Change', 'What becomes easier or clearer when interactive?'], ['Access', 'Can learners still complete the activity on their device?'] ] },
  ],
  [events[2].id]: [
    { id: 'demo-template-03', type: 'template', label: 'Flow template', title: 'Watch, pause and think', availableFrom: 'upcoming', publicPreview: true,
      description: 'A simple sequence for adding purposeful checkpoints to a video.',
      sections: [ ['Before', 'Set a viewing purpose or invite a prediction.'], ['Pause', 'Ask one question at a moment that matters.'], ['Respond', 'Give learners time to explain or apply what they noticed.'], ['After', 'Connect the video to a new task or reflection.'] ] },
    { id: 'demo-guide-03', type: 'guide', label: 'Design guide', title: 'Choose the right video checkpoint', availableFrom: 'live', publicPreview: false,
      description: 'A short guide to deciding where and why a video should pause.',
      sections: [ ['Moment', 'What is changing or becoming important here?'], ['Question', 'What should learners think about at this point?'], ['Next step', 'How will their response shape what follows?'] ] },
  ],
});

export const resources = resourceSets[workshop.id];
export const allResources = Object.values(resourceSets).flat();
export const challengesById = Object.fromEntries(challenges.map(item => [item.id, item]));
export const contributionKinds = { idea: 'I have an idea', need_help: 'I need help', can_help: 'I can help', made_something: 'I made something' };

export const initialQuestions = [
  { id: 'demo-question-01', author: 'Studio example', body: 'How could I adapt this sequence for learners who are not confident speaking yet?', contextId: workshop.id, votes: 8, createdAt: '2026-09-19T08:00:00Z', answer: null },
  { id: 'demo-question-02', author: 'Studio example', body: 'Could the reflection activity work for self-study as well?', contextId: 'demo-template-01', votes: 5, createdAt: '2026-09-19T08:05:00Z', answer: 'Yes. Give learners a specific prompt and a model response, then ask them to revisit their first answer. This is a sample trainer answer.' },
  { id: 'demo-question-03', author: 'Studio example', body: 'What would you remove for a 30-minute lesson?', contextId: workshop.id, votes: 3, createdAt: '2026-09-19T08:10:00Z', answer: null },
  { id: 'demo-question-04', author: 'Studio example', body: 'How do you decide which worksheet instructions should stay on screen?', contextId: 'demo-workshop-02', votes: 4, createdAt: '2026-09-19T08:15:00Z', answer: null },
  { id: 'demo-question-05', author: 'Studio example', body: 'How often should a video pause for a learner response?', contextId: 'demo-workshop-03', votes: 6, createdAt: '2026-09-19T08:20:00Z', answer: null },
];

export const initialThreads = [
  { id: 'demo-thread-01', author: 'Studio example', kind: 'idea', contextId: 'demo-template-01', title: 'Let learners choose the destination', body: 'I would give each pair a different town map so the final conversations have different outcomes.\n\nFlow example: https://wistudi.tgndigital.vn/share/flow/4tcj7WscphXpR-mthJ8ThA', replies: [
    { id: 'demo-reply-01', author: 'Wistudi Trainer', body: 'What information would each partner need that the other does not have?' },
    { id: 'demo-reply-02', author: 'Studio example', body: 'I would give each partner a different budget and a short list of places.' },
    { id: 'demo-reply-03', author: 'Wistudi Trainer', body: 'That gives learners a real reason to ask questions before they agree.' },
  ] },
  { id: 'demo-thread-02', author: 'Studio example', kind: 'need_help', contextId: 'demo-challenge-02', title: 'Adapting a worksheet for mobile', body: 'I am looking at a matching task. What could learners do that would make the digital version useful on a phone?', replies: [] },
  { id: 'demo-thread-03', author: 'Studio example', kind: 'can_help', contextId: 'demo-template-03', title: 'A checkpoint question for short videos', body: 'I can share some examples of prediction prompts that work well before a video reveal.', replies: [] },
];

export function challengeFor(workshopId) {
  return challenges.find(item => item.workshopId === workshopId) || challenge;
}

export function resourcesFor(workshopId) {
  return resourceSets[workshopId] || resources;
}

export function contextFor(id) {
  const event = events.find(item => item.id === id);
  if (event) return { id, type: 'workshop', title: event.title, workshopId: event.id, subject: event.subject, topic: event.topic, level: event.level };
  const challengeItem = challengesById[id];
  if (challengeItem) {
    const owner = events.find(item => item.id === challengeItem.workshopId);
    return { id, type: 'challenge', title: challengeItem.title, workshopId: owner.id, subject: owner.subject, topic: owner.topic, level: owner.level };
  }
  const resource = allResources.find(item => item.id === id);
  if (resource) {
    const ownerId = Object.keys(resourceSets).find(key => resourceSets[key].some(item => item.id === id));
    const owner = events.find(item => item.id === ownerId);
    return { id, type: resource.type, title: resource.title, workshopId: owner.id, subject: owner.subject, topic: owner.topic, level: owner.level };
  }
  throw new Error('Unknown discussion context.');
}
