export async function onRequest(context){
  const roomBinding=context.env.INVESTOR_ROOM_PRESENCE;
  if(!roomBinding)return new Response('Investor room presence is not configured.',{status:503});
  const id=roomBinding.idFromName('wistudi-investor-room-global');
  const stub=roomBinding.get(id);
  return stub.fetch(context.request);
}
