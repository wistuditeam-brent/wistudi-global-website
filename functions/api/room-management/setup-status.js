const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({env}){
 if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 const row=await env.ROOM_DB.prepare('SELECT COUNT(*) AS n FROM room_managers').first();
 return json({ok:true,needs_setup:Number(row?.n||0)===0});
}
