export async function onRequest(context){
  // The event page runtime is loaded in one ordered sequence by assets/js/site-shell.js.
  // Do not inject duplicate component scripts here: the previous double-loading created
  // competing renderers, timers and translation observers on production Pages routes.
  return context.next();
}
