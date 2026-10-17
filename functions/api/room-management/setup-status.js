const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({env}){
 try{
  if(!env.ROOM_DB)return json({error:'database_unavailable',detail:'ROOM_DB is not available on this deployment.'},503);
  const row=await env.ROOM_DB.prepare('SELECT COUNT(*) AS n FROM room_managers').first();
  return json({ok:true,needs_setup:Number(row?.n||0)===0,bootstrap_ready:!!env.ROOM_BOOTSTRAP_TOKEN});
 }catch(error){
  return json({error:'setup_status_failed',detail:String(error?.message||error).slice(0,180)},500);
 }
}
