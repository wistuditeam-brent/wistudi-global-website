export async function ensureContentTranslationSchema(env){
 const db=env.ROOM_DB;if(!db)return;
 await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS room_content_translation_links (
   group_id TEXT NOT NULL,
   content_id TEXT NOT NULL UNIQUE,
   locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(group_id,locale)
  )`),
  db.prepare('CREATE INDEX IF NOT EXISTS room_content_translation_group ON room_content_translation_links(group_id)')
 ]);
}
export async function ensureClientContentTranslationLinks(env){
 await ensureContentTranslationSchema(env);
 const db=env.ROOM_DB;if(!db)return;
 const marker=await db.prepare("SELECT id FROM room_management_audit WHERE id='client-content-translations-v1'").first();
 if(marker)return;
 const pairs=await db.prepare(`
  SELECT e.id AS en_id,v.id AS vi_id
  FROM room_content e
  JOIN room_content v ON v.room_id=e.room_id AND v.category=e.category AND v.asset_url=e.asset_url AND v.locale='vi'
  LEFT JOIN room_content_translation_links le ON le.content_id=e.id
  LEFT JOIN room_content_translation_links lv ON lv.content_id=v.id
  WHERE e.room_id='client' AND e.locale='en' AND le.content_id IS NULL AND lv.content_id IS NULL
  ORDER BY e.created_at,v.created_at
 `).all();
 const used=new Set(),stmts=[];
 for(const row of pairs.results||[]){
  if(used.has(row.en_id)||used.has(row.vi_id))continue;
  used.add(row.en_id);used.add(row.vi_id);const group=crypto.randomUUID();
  stmts.push(
   db.prepare('INSERT OR IGNORE INTO room_content_translation_links(group_id,content_id,locale) VALUES(?,?,?)').bind(group,row.en_id,'en'),
   db.prepare('INSERT OR IGNORE INTO room_content_translation_links(group_id,content_id,locale) VALUES(?,?,?)').bind(group,row.vi_id,'vi')
  );
 }
 stmts.push(db.prepare("INSERT OR IGNORE INTO room_management_audit(id,actor_manager_id,action,room_id,target_id) VALUES('client-content-translations-v1',NULL,'content_translations_linked','client',NULL)"));
 await db.batch(stmts);
}
export async function translationForContent(env,contentId){
 await ensureContentTranslationSchema(env);
 return env.ROOM_DB.prepare('SELECT group_id,locale FROM room_content_translation_links WHERE content_id=?').bind(contentId).first();
}
export async function ensureTranslationLink(env,contentId,locale,groupId=null){
 await ensureContentTranslationSchema(env);
 const existing=await env.ROOM_DB.prepare('SELECT group_id,locale FROM room_content_translation_links WHERE content_id=?').bind(contentId).first();
 if(existing)return existing;
 const group=groupId||crypto.randomUUID();
 const occupied=await env.ROOM_DB.prepare('SELECT content_id FROM room_content_translation_links WHERE group_id=? AND locale=?').bind(group,locale).first();
 if(occupied)throw new Error('translation_locale_exists');
 await env.ROOM_DB.prepare('INSERT INTO room_content_translation_links(group_id,content_id,locale) VALUES(?,?,?)').bind(group,contentId,locale).run();
 return {group_id:group,locale};
}
