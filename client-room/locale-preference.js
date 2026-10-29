// Remember explicit language choices. Do not infer a preference from page visits:
// a shared Vietnamese URL should still work without changing a saved choice.
(function(){
 const key='wistudi_client_room_locale';
 const links=document.querySelectorAll('.language-pop a');
 for(const link of links){
  link.addEventListener('click',()=>{
   let chosen=link.id==='langVi'?'vi':link.id==='langEn'?'en':null;
   if(!chosen){
    try{chosen=new URL(link.href,location.origin).pathname.startsWith('/client-room/vi/')?'vi':'en'}
    catch{return}
   }
   document.cookie=key+'='+chosen+'; Path=/client-room; Max-Age=31536000; SameSite=Lax; Secure';
  });
 }
})();
