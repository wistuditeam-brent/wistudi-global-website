PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO studio_workspaces (id, name, slug, status)
VALUES ('preview-workspace', 'Wistudi Publisher Studio Preview', 'publisher-studio-preview', 'active');

INSERT OR IGNORE INTO studio_events
(id, workspace_id, slug, title, summary, subject, topic, level, audience, trainer, starts_at, timezone, duration_minutes, format, status, banner_url, meeting_mode, output, learning_outcomes_json)
VALUES
('demo-workshop-01','preview-workspace','communicative-esl','Build a communicative English lesson','Turn a familiar speaking task into a learning sequence your learners can explore, practise and make their own.','English','Speaking','B1','English teachers and tutors','Wistudi Trainer','2026-10-01T07:00:00Z','Asia/Ho_Chi_Minh',60,'Live online workshop','upcoming','/assets/images/resources/events/communicative-esl-flow/event-banner.webp','manual-link-preview','A reusable communicative lesson outline and one speaking activity.','["Adapt a speaking task into a communicative lesson sequence.","Design one purposeful speaking activity with support for learners.","Plan a short reflection that helps learners notice their progress."]'),
('demo-workshop-02','preview-workspace','worksheet-to-flow','Turn a worksheet into an interactive learning experience','Keep the useful teaching intent of a worksheet while giving learners meaningful ways to respond and practise.','English','Worksheets','A2–B1','Teachers adapting existing materials','Wistudi Trainer','2026-10-08T08:00:00Z','Asia/Ho_Chi_Minh',60,'Live online workshop','upcoming',NULL,'not-connected','A worksheet activity plan ready to build as a Flow.','["Identify the learning purpose behind a worksheet task.","Choose an interaction that supports the task goal.","Plan how to adapt the activity for a Wistudi Flow."]'),
('demo-workshop-03','preview-workspace','interactive-video','Design an interactive video lesson','Plan moments for learners to notice, predict, respond and reflect while watching a video.','English','Interactive video','B1–B2','Teachers and learning designers','Wistudi Trainer','2026-10-15T08:00:00Z','Asia/Ho_Chi_Minh',75,'Live online workshop','upcoming',NULL,'not-connected','A short interactive video sequence with purposeful learner checkpoints.','["Select meaningful pause points in a video.","Write questions that prompt learners to notice and respond.","Connect video responses to a follow-up learning task."]');

INSERT OR IGNORE INTO studio_challenges (id, event_id, title, description, status)
VALUES
('demo-challenge-01','demo-workshop-01','Make one speaking activity your own','Adapt the sample lesson for your learners. Include a clear speaking goal, a useful prompt and a moment for reflection.','active'),
('demo-challenge-02','demo-workshop-02','Remix one worksheet task','Choose a worksheet task and plan one interactive response that helps learners practise the same skill.','active'),
('demo-challenge-03','demo-workshop-03','Add a purposeful video checkpoint','Choose a short video moment and write one question that helps learners think before they continue watching.','active');

INSERT OR IGNORE INTO studio_resources
(id, event_id, type, label, title, description, available_from, public_preview, content_json)
VALUES
('demo-template-01','demo-workshop-01','template','Flow template','From practice to conversation','A five-part outline for a communicative B1 lesson.','upcoming',1,'{}'),
('demo-worksheet-01','demo-workshop-01','worksheet','Worksheet','Plan a day out','A printable-style task brief to pair with the lesson.','live',0,'{}'),
('demo-guide-01','demo-workshop-01','guide','Planning guide','Give every activity a purpose','A short checklist for designing a teaching sequence.','post_session',0,'{}'),
('demo-template-02','demo-workshop-02','template','Flow template','Worksheet to interactive Flow','A planning pattern for adapting a familiar paper activity.','upcoming',1,'{}'),
('demo-guide-02','demo-workshop-02','guide','Adaptation guide','A worksheet adaptation checklist','Questions to ask before moving a task from paper to screen.','post_session',0,'{}'),
('demo-template-03','demo-workshop-03','template','Flow template','Watch, pause and think','A simple sequence for adding purposeful checkpoints to a video.','upcoming',1,'{}'),
('demo-guide-03','demo-workshop-03','guide','Design guide','Choose the right video checkpoint','A short guide to deciding where and why a video should pause.','live',0,'{}');

INSERT OR IGNORE INTO studio_schema_migrations(version) VALUES ('0002_preview_seed');
