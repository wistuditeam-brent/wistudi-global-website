export class InvestorRoomPresence {
  constructor(state,env){this.state=state;this.env=env}
  async fetch(request){
    if(request.headers.get('Upgrade')!=='websocket')return new Response('WebSocket required',{status:426});
    const pair=new WebSocketPair();const client=pair[0],server=pair[1];
    this.state.acceptWebSocket(server);
    server.serializeAttachment({joinedAt:Date.now()});
    this.broadcast();
    return new Response(null,{status:101,webSocket:client});
  }
  webSocketMessage(ws,message){
    try{
      const data=JSON.parse(message);
      if(data.type==='join'){
        ws.serializeAttachment({
          joinedAt:Date.now(),
          // Stored privately with the socket. Never included in broadcasts.
          name:String(data.name||'').slice(0,120),
          organisation:String(data.organisation||'').slice(0,160),
          wst:String(data.wst||'').slice(0,100)
        });
      }
    }catch(_){}
    this.broadcast();
  }
  webSocketClose(){this.broadcast()}
  webSocketError(){this.broadcast()}
  broadcast(){
    const sockets=this.state.getWebSockets();
    const payload=JSON.stringify({type:'presence',count:sockets.length});
    for(const socket of sockets){try{socket.send(payload)}catch(_){}}
  }
}
export default {async fetch(){return new Response('Investor Room presence worker',{status:200})}};
