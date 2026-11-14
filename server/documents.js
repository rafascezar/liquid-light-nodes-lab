import {cleanGraph,newNode} from '../src/model.js';
import {cleanWorkspaceState} from '../src/workspaces.js';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const response=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
async function ownerPrefix(id){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));return 'users/'+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')+'/';}
function asset(data){const n=newNode('group');n.data=data;return cleanGraph({version:1,name:'Asset',nodes:[n],edges:[],preview:n.id,duration:6}).nodes[0].data;}
export function cleanState(raw){if(!raw||!raw.document)throw new Error('A document is required.');return {document:cleanGraph(raw.document),workspace:cleanWorkspaceState(raw.workspace),assets:(Array.isArray(raw.assets)?raw.assets:[]).slice(0,24).map(a=>({id:String(a.id).slice(0,100),name:String(a.name||'Group').slice(0,60),saved:Number(a.saved)||0,data:asset(a.data)})),time:Math.max(0,Math.min(30,Number(raw.time)||0)),saved:Number(raw.saved)||Date.now()};}
function cleanSnapshot(raw,id){if(!raw?.graph)throw new Error('A graph is required.');const graph=cleanGraph(raw.graph),thumbnail=typeof raw.thumbnail==='string'&&raw.thumbnail.length<400000&&/^data:image\/(webp|png);base64,[a-zA-Z0-9+/]+=*$/.test(raw.thumbnail)?raw.thumbnail:null;return {id,name:String(raw.name||graph.name).slice(0,80),saved:Date.now(),graph,time:Math.max(0,Math.min(graph.duration,Number(raw.time)||0)),thumbnail};}
export async function documents(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return null;
 const id=request.headers.get('oai-authenticated-user-id');if(!id)return response({error:'Sign in with ChatGPT to sync this workspace.'},401);
 if(!env.BUCKET)return response({error:'Cloud storage is unavailable. Local work is retained.'},503);
 const origin=request.headers.get('Origin');if(!['GET','HEAD'].includes(request.method)&&origin!==url.origin)return response({error:'This write must come from the same site.'},403);
 const prefix=await ownerPrefix(id),route=url.pathname.slice(5),isState=route==='state',isList=route==='sessions',match=route.match(/^sessions\/([a-f0-9-]{36})$/i),key=prefix+(isState?'state.json':match?'sessions/'+match[1]+'.json':'');
 if(route==='account'&&request.method==='GET')return response({authenticated:true,sync:true});
 if(isList&&request.method==='GET'){const listed=await env.BUCKET.list({prefix:prefix+'sessions/',limit:100,include:['customMetadata']}),items=listed.objects.map(o=>({id:o.key.split('/').at(-1).replace('.json',''),name:o.customMetadata?.name||'Study',saved:Number(o.customMetadata?.saved)||o.uploaded?.getTime()||0,cloud:true})).sort((a,b)=>b.saved-a.saved);return response({items});}
 if(!isState&&!match&&!isList)return response({error:'Not found.'},404);
 if((isState||match)&&request.method==='GET'){const obj=await env.BUCKET.get(key);if(!obj)return response({error:'Not found.'},404);const data=JSON.parse(await new Response(obj.body).text());return response({...data,revision:obj.httpEtag},200,{ETag:obj.httpEtag,'X-Workspace-Revision':obj.httpEtag});}
 if((isState&&request.method==='PUT')||(isList&&request.method==='POST')){const max=12_000_000;if(Number(request.headers.get('content-length'))>max)return response({error:'The project is larger than 12 MB.'},413);let raw;try{const bytes=await request.arrayBuffer();if(bytes.byteLength>max)return response({error:'The project is larger than 12 MB.'},413);raw=JSON.parse(new TextDecoder().decode(bytes));}catch{return response({error:'Invalid project JSON.'},400);}
 let body;try{body=isState?cleanState(raw):cleanSnapshot(raw,crypto.randomUUID());}catch(error){return response({error:error.message},400);}
 const destination=isState?key:prefix+'sessions/'+body.id+'.json';
 if(isState&&!request.headers.has('If-Match')&&request.headers.get('If-None-Match')!=='*')return response({error:'Load the current cloud revision before saving.'},428);
 const conditionHeaders=new Headers(request.headers);if(conditionHeaders.has('If-Match'))conditionHeaders.set('If-Match',conditionHeaders.get('If-Match').replace(/^W\//,''));
 const result=await env.BUCKET.put(destination,JSON.stringify(body),{httpMetadata:{contentType:'application/json'},customMetadata:{name:body.name||body.document.name,saved:String(body.saved)},onlyIf:isState?conditionHeaders:new Headers({'If-None-Match':'*'})});
 if(!result)return response({error:'Another device saved a newer revision. Your local work is retained.'},412);
 return response(isState?{saved:body.saved,revision:result.httpEtag}:{...body,cloud:true,revision:result.httpEtag},isState?200:201,{ETag:result.httpEtag,'X-Workspace-Revision':result.httpEtag});
 }
 return response({error:'Method not allowed.'},405,{Allow:isState?'GET, PUT':isList?'GET, POST':'GET'});
}
