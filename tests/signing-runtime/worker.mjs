import { onRequest as signing } from '../../functions/api/room-management/signing.js';
import { onRequest as upload } from '../../functions/api/room-management/signing-upload.js';
import { onRequest as guest } from '../../functions/api/room-management/signing-guest.js';
import { onRequest as file } from '../../functions/api/room-management/signing-file.js';
import { onRequest as session } from '../../functions/api/room-management/session.js';
const routes={signing,'signing-upload':upload,'signing-guest':guest,'signing-file':file,session};
export default {fetch(request,env){const name=new URL(request.url).pathname.split('/').pop();return routes[name]?.({request,env})||new Response('Not found',{status:404});}};
