export async function onRequest(context){
  const response=await context.next();
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('body',{element(el){
      el.append('<script src="/assets/js/event-registration-component.js" defer></script>',{html:true});
      el.append('<script src="/assets/js/event-registration-live-bridge.js" defer></script>',{html:true});
      el.append('<script src="/assets/js/event-facts-component.js" defer></script>',{html:true});
      el.append('<script src="/assets/js/event-live-session-component.js" defer></script>',{html:true});
    }})
    .transform(response);
}
