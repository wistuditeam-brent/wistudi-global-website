let thumbnailSchemaReady=false;
export async function ensureVideoThumbnailSchema(env){
 const db=env.ROOM_DB;if(!db||thumbnailSchemaReady)return;
 await db.prepare("CREATE TABLE IF NOT EXISTS room_video_thumbnails (target_type TEXT NOT NULL CHECK(target_type IN ('content','partner')),target_id TEXT NOT NULL,thumbnail_url TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(target_type,target_id))").run();
 thumbnailSchemaReady=true;
}
export async function setVideoThumbnail(env,targetType,targetId,url){
 await ensureVideoThumbnailSchema(env);const db=env.ROOM_DB;if(!db)return;
 const value=typeof url==='string'?url.trim():'';
 if(!value){await db.prepare('DELETE FROM room_video_thumbnails WHERE target_type=? AND target_id=?').bind(targetType,targetId).run();return}
 await db.prepare("INSERT INTO room_video_thumbnails(target_type,target_id,thumbnail_url,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(target_type,target_id) DO UPDATE SET thumbnail_url=excluded.thumbnail_url,updated_at=CURRENT_TIMESTAMP").bind(targetType,targetId,value).run();
}
