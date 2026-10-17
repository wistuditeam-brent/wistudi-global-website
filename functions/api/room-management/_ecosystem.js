export async function ensureEcosystemSchema(env){
 const db=env.ROOM_DB;if(!db)return;
 await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS room_partners (
   id TEXT PRIMARY KEY,
   room_id TEXT NOT NULL,
   locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
   slug TEXT NOT NULL,
   title TEXT NOT NULL,
   short_description TEXT NOT NULL DEFAULT '',
   banner_url TEXT NOT NULL,
   video_url TEXT NOT NULL DEFAULT '',
   about_text TEXT NOT NULL DEFAULT '',
   capability_bullets TEXT NOT NULL DEFAULT '[]',
   website_url TEXT NOT NULL DEFAULT '',
   tags TEXT NOT NULL DEFAULT '[]',
   gallery_urls TEXT NOT NULL DEFAULT '[]',
   status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
   sort_order INTEGER NOT NULL DEFAULT 0,
   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   UNIQUE(room_id,locale,slug)
  )`),
  db.prepare(`CREATE TABLE IF NOT EXISTS room_partner_settings (
   room_id TEXT NOT NULL,
   locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
   title TEXT NOT NULL,
   intro TEXT NOT NULL,
   updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(room_id,locale)
  )`),
  db.prepare(`CREATE TABLE IF NOT EXISTS room_contact_settings (
   room_id TEXT NOT NULL,
   locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
   title TEXT NOT NULL,
   intro TEXT NOT NULL DEFAULT '',
   business_address TEXT NOT NULL DEFAULT '',
   primary_email TEXT NOT NULL DEFAULT '',
   secondary_email TEXT NOT NULL DEFAULT '',
   primary_phone TEXT NOT NULL DEFAULT '',
   facebook_url TEXT NOT NULL DEFAULT '',
   linkedin_url TEXT NOT NULL DEFAULT '',
   website_url TEXT NOT NULL DEFAULT '',
   extra_contacts TEXT NOT NULL DEFAULT '[]',
   updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(room_id,locale)
  )`),
  db.prepare('CREATE INDEX IF NOT EXISTS room_partners_listing ON room_partners(room_id,locale,status,sort_order)')
 ]);
}
export async function ensureClientEcosystemDefaults(env){
 await ensureEcosystemSchema(env);const db=env.ROOM_DB;if(!db)return;
 const enIntro='Wistudi works with specialist technology and education partners to extend the capabilities of the Wistudi platform. These partnerships build on Wistudi Core to support more engaging, specialised and connected learning experiences, while keeping creation, delivery and publishing in one coherent environment.';
 const viIntro='Wistudi hợp tác với các đối tác công nghệ và giáo dục chuyên biệt để mở rộng khả năng của nền tảng Wistudi. Các quan hệ hợp tác này phát triển trên nền Wistudi Core nhằm hỗ trợ những trải nghiệm học tập hấp dẫn, chuyên sâu và kết nối hơn, đồng thời vẫn giữ việc tạo nội dung, phân phối và xuất bản trong một môi trường thống nhất.';
 const extraEn=JSON.stringify([{name:'Wistudi Partnerships',role:'Partnerships',region:'Global',email:'partnerships@wistudi.com',phone:'',link:''},{name:'Wistudi Support',role:'Platform support',region:'Global',email:'support@wistudi.com',phone:'',link:''}]);
 const extraVi=JSON.stringify([{name:'Wistudi Partnerships',role:'Hợp tác',region:'Toàn cầu',email:'partnerships@wistudi.com',phone:'',link:''},{name:'Wistudi Support',role:'Hỗ trợ nền tảng',region:'Toàn cầu',email:'support@wistudi.com',phone:'',link:''}]);
 await db.batch([
  db.prepare('INSERT OR IGNORE INTO room_partner_settings(room_id,locale,title,intro) VALUES(?,?,?,?)').bind('client','en','Partner Ecosystem',enIntro),
  db.prepare('INSERT OR IGNORE INTO room_partner_settings(room_id,locale,title,intro) VALUES(?,?,?,?)').bind('client','vi','Hệ sinh thái Đối tác',viIntro),
  db.prepare('INSERT OR IGNORE INTO room_contact_settings(room_id,locale,title,intro,business_address,primary_email,secondary_email,primary_phone,facebook_url,linkedin_url,website_url,extra_contacts) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind('client','en','Contact Wistudi','Talk to Wistudi about the platform, partnerships, publishing, integrations or general enquiries.','128 City Road, London, United Kingdom, EC1V 2NX','support@wistudi.com','partnerships@wistudi.com','+84 879 876 624','https://www.facebook.com/profile.php?id=61590336100890','','https://global.wistudi.com',extraEn),
  db.prepare('INSERT OR IGNORE INTO room_contact_settings(room_id,locale,title,intro,business_address,primary_email,secondary_email,primary_phone,facebook_url,linkedin_url,website_url,extra_contacts) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind('client','vi','Liên hệ Wistudi','Liên hệ Wistudi về nền tảng, quan hệ đối tác, xuất bản, tích hợp hoặc các câu hỏi chung.','128 City Road, London, United Kingdom, EC1V 2NX','support@wistudi.com','partnerships@wistudi.com','+84 879 876 624','https://www.facebook.com/profile.php?id=61590336100890','','https://global.wistudi.com',extraVi)
 ]);
}
export function parseList(text){try{const v=JSON.parse(text||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
