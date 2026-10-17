export async function ensureVideoSchema(env){
 const db=env.ROOM_DB;if(!db)return;
 await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS room_video_groups (
   id TEXT PRIMARY KEY,
   room_id TEXT NOT NULL,
   locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
   title TEXT NOT NULL,
   description TEXT NOT NULL DEFAULT '',
   sort_order INTEGER NOT NULL DEFAULT 0,
   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`),
  db.prepare(`CREATE TABLE IF NOT EXISTS room_video_group_membership (
   content_id TEXT PRIMARY KEY,
   group_id TEXT NOT NULL,
   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`),
  db.prepare('CREATE INDEX IF NOT EXISTS room_video_groups_listing ON room_video_groups(room_id,locale,sort_order)'),
  db.prepare('CREATE INDEX IF NOT EXISTS room_video_membership_group ON room_video_group_membership(group_id)')
 ]);
}
export async function ensureClientVideoGroups(env){
 await ensureVideoSchema(env);
 const db=env.ROOM_DB;if(!db)return;
 const marker=await db.prepare("SELECT id FROM room_management_audit WHERE id='client-video-groups-v1'").first();
 if(marker)return;
 const groups=[
  ['seed-vgroup-en-platform','client','en','Platform & Product Overview','Start here for an introduction to Wistudi, the platform and its learning-publishing approach.',10],
  ['seed-vgroup-en-action','client','en','Wistudi in Action','See Wistudi presented, demonstrated and experienced in real event settings.',20],
  ['seed-vgroup-en-publishing','client','en','Teaching & Publishing','Explore educator-led publishing, interactive lessons, classroom use and printable resources.',30],
  ['seed-vgroup-vi-platform','client','vi','Tổng quan Nền tảng & Sản phẩm','Bắt đầu với phần giới thiệu về Wistudi, nền tảng và cách tiếp cận xuất bản nội dung học tập.',10],
  ['seed-vgroup-vi-action','client','vi','Wistudi trong Thực tế','Xem Wistudi được giới thiệu, trình diễn và trải nghiệm trong các sự kiện thực tế.',20],
  ['seed-vgroup-vi-publishing','client','vi','Giảng dạy & Xuất bản','Khám phá xuất bản do giáo viên dẫn dắt, bài học tương tác, sử dụng trong lớp và tài nguyên in.',30]
 ];
 const memberships=[
  ['seed-video-en-platform','seed-vgroup-en-platform'],['seed-video-en-event','seed-vgroup-en-action'],
  ['seed-video-en-publisher','seed-vgroup-en-publishing'],['seed-video-en-classroom','seed-vgroup-en-publishing'],
  ['seed-video-vi-platform','seed-vgroup-vi-platform'],['seed-video-vi-event','seed-vgroup-vi-action'],
  ['seed-video-vi-publisher','seed-vgroup-vi-publishing'],['seed-video-vi-classroom','seed-vgroup-vi-publishing']
 ];
 const stmts=[
  ...groups.map(g=>db.prepare('INSERT OR IGNORE INTO room_video_groups(id,room_id,locale,title,description,sort_order) VALUES(?,?,?,?,?,?)').bind(...g)),
  ...memberships.map(m=>db.prepare('INSERT OR IGNORE INTO room_video_group_membership(content_id,group_id) VALUES(?,?)').bind(...m)),
  db.prepare("INSERT OR IGNORE INTO room_management_audit(id,actor_manager_id,action,room_id,target_id) VALUES('client-video-groups-v1',NULL,'video_groups_seeded','client',NULL)")
 ];
 await db.batch(stmts);
}
export async function validVideoGroup(env,groupId,room,locale){
 if(!groupId)return true;
 await ensureVideoSchema(env);
 const row=await env.ROOM_DB.prepare('SELECT id FROM room_video_groups WHERE id=? AND room_id=? AND locale=?').bind(groupId,room,locale).first();
 return !!row;
}
