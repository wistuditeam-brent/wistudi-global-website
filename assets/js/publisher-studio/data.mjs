// All records in this module are fixtures, not published events or member data.
export const workshop = Object.freeze({
  id: 'demo-workshop-01', slug: 'communicative-esl',
  title: 'Build a communicative English lesson',
  summary: 'Turn a familiar speaking task into a learning sequence your learners can explore, practise and make their own.',
  subject: 'English', topic: 'Speaking', level: 'B1',
  trainer: 'Wistudi Trainer', startsAt: '2026-10-01T07:00:00Z', duration: 60,
});

export const challenge = Object.freeze({
  id: 'demo-challenge-01', title: 'Make one speaking activity your own',
  description: 'Adapt the sample lesson for your learners. Include a clear speaking goal, a useful prompt and a moment for reflection.',
});

export const resources = [
  { id: 'demo-template-01', type: 'template', label: 'Flow template', title: 'From practice to conversation',
    description: 'A five-part outline for a communicative B1 lesson.',
    sections: [ ['Notice', 'Introduce a real situation: two learners are planning a day out. What do they need to decide?'], ['Prepare', 'Collect useful phrases for suggesting, agreeing and disagreeing.'], ['Practise', 'Try a short exchange with a partner using a phrase bank.'], ['Communicate', 'Agree on a plan with a budget and two different preferences.'], ['Reflect', 'Which phrase helped you keep the conversation going? What would you try next time?'] ] },
  { id: 'demo-worksheet-01', type: 'worksheet', label: 'Worksheet', title: 'Plan a day out',
    description: 'A printable-style task brief to pair with the lesson.',
    sections: [ ['Your task', 'Plan a day out together. You have a shared budget of $30 and four hours.'], ['Partner A', 'You enjoy being outdoors. Suggest two activities and explain why.'], ['Partner B', 'You want to try something new. Ask questions before you agree.'], ['Reflect together', 'Write down your plan, one compromise and one phrase you would use again.'] ] },
  { id: 'demo-guide-01', type: 'guide', label: 'Planning guide', title: 'Give every activity a purpose',
    description: 'A short checklist for designing a teaching sequence.',
    sections: [ ['Learning goal', 'What should learners be able to do by the end?'], ['Support', 'What language or examples do they need first?'], ['Choice', 'Where do learners make a meaningful decision?'], ['Evidence', 'How will you know they can use what they have learned?'] ] },
];

export const initialQuestions = [
  { id: 'demo-question-01', author: 'Participant A', body: 'How could I adapt this sequence for learners who are not confident speaking yet?', contextId: workshop.id, votes: 8, createdAt: '2026-09-19T08:00:00Z', answer: null },
  { id: 'demo-question-02', author: 'Participant B', body: 'Could the reflection activity work for self-study as well?', contextId: 'demo-template-01', votes: 5, createdAt: '2026-09-19T08:05:00Z', answer: 'Yes. Give learners a specific prompt and a model response, then ask them to revisit their first answer. This is a sample trainer answer.' },
  { id: 'demo-question-03', author: 'Participant C', body: 'What would you remove for a 30-minute lesson?', contextId: workshop.id, votes: 3, createdAt: '2026-09-19T08:10:00Z', answer: null },
];

export const initialThreads = [
  { id: 'demo-thread-01', author: 'Participant A', kind: 'idea', contextId: 'demo-template-01', title: 'Let learners choose the destination', body: 'I would give each pair a different town map so the final conversations have different outcomes.', replies: [{ id: 'demo-reply-01', author: 'Wistudi Trainer', body: 'What information would each partner need that the other does not have?' }] },
  { id: 'demo-thread-02', author: 'Participant B', kind: 'need_help', contextId: challenge.id, title: 'Making the task work with a mixed-level group', body: 'I am considering optional phrase banks. How much support would you offer without removing the challenge?', replies: [] },
  { id: 'demo-thread-03', author: 'Participant C', kind: 'can_help', contextId: 'demo-worksheet-01', title: 'A printable version for pair work', body: 'I can help think through separate task cards for each partner.', replies: [] },
];

export const contributionKinds = { idea: 'I have an idea', need_help: 'I need help', can_help: 'I can help', made_something: 'I made something' };

export function contextFor(id) {
  const resource = resources.find(item => item.id === id);
  if (id !== workshop.id && id !== challenge.id && !resource) throw new Error('Unknown discussion context.');
  return {
    id, type: resource?.type || (id === challenge.id ? 'challenge' : 'workshop'),
    title: resource?.title || (id === challenge.id ? challenge.title : workshop.title),
    workshopId: workshop.id, subject: workshop.subject, topic: workshop.topic, level: workshop.level,
  };
}
