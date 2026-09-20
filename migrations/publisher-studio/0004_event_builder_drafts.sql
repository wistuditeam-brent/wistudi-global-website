-- Shared draft fields used by the Publisher Studio Event Builder.
ALTER TABLE studio_events ADD COLUMN card_image_url TEXT;
ALTER TABLE studio_events ADD COLUMN mobile_card_image_url TEXT;
ALTER TABLE studio_events ADD COLUMN promo_video_url TEXT;
ALTER TABLE studio_events ADD COLUMN image_alt TEXT NOT NULL DEFAULT '';
ALTER TABLE studio_events ADD COLUMN discussion_prompt TEXT NOT NULL DEFAULT '';
ALTER TABLE studio_events ADD COLUMN wistudi_link TEXT;

INSERT OR IGNORE INTO studio_schema_migrations(version)
VALUES ('0004_event_builder_drafts');
