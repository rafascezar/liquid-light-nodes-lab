import {SHAPES,primitiveGeometry,parameterVisible} from './primitives.js';
import {EXTENSIONS,DEFAULT_PATH,cleanPaths,samplePaths} from './extended.js';
import {countMetric} from './performance.js';
import {ROOT_CONTEXT,fieldSample,sampleSignal,signalFunction,signalDomain,signalUses,shapeContext,pathCoordinates} from './signals.js';
import { ENABLE_TYPOGRAPHY, textToShapes, typographyNodeDefinition } from './typography/index.js';
export const W=1920,H=1080;
export const renderTimelines=new WeakMap();
export const TYPES={shape:'#67ddd9',field:'#cba0f3',palette:'#f0adce',signal:'#edc669',image:'#389aff',material:'#8ed3bb',effects:'#f2ae79'};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const num=(label,value,min,max,step=1,unit='')=>({label,value,min,max,step,unit,type:'number'});
const select=(label,value,options)=>({label,value,options,type:'select'});
const input=(id,type,required=true)=>({id,type,required});
export const REGISTRY={
 circle:{name:'Circle',category:'Sources',out:'shape',icon:'circle',description:'A resolution-independent circular path.',inputs:[],params:{radius:num('Radius',340,10,1000,1,'px'),x:num('Centre X',760,-960,2880,1,'px'),y:num('Centre Y',540,-540,1620,1,'px')}},
 rectangle:{name:'Rectangle',category:'Sources',out:'shape',icon:'square',description:'A rounded rectangle, kept as an editable path.',inputs:[],params:{width:num('Width',640,20,1800,1,'px'),height:num('Height',640,20,1800,1,'px'),corner:num('Corner radius',80,0,600,1,'px'),x:num('Centre X',960,-960,2880,1,'px'),y:num('Centre Y',540,-540,1620,1,'px')}},
 triangle:{name:'Triangle',category:'Sources',out:'shape',icon:'triangle',description:'A parametric three-sided path.',inputs:[],params:{radius:num('Radius',370,10,1000,1,'px'),x:num('Centre X',960,-960,2880,1,'px'),y:num('Centre Y',540,-540,1620,1,'px')}},
 outline:{name:'Outline',category:'Shape',out:'shape',icon:'outline',description:'Turn a filled path into an outline. Geometry stays editable.',inputs:[input('shape','shape')],bypass:'shape',params:{width:num('Stroke width',48,1,240,1,'px')}},
 trim:{name:'Trim Path',category:'Shape',out:'shape',icon:'trim',description:'Reveal a percentage of the path, with a movable starting point.',inputs:[input('shape','shape')],bypass:'shape',params:{start:num('Start',0,0,100,1,'%'),end:num('End',88,0,100,1,'%'),offset:num('Offset',-20,-720,720,1,'°')}},
 transform:{name:'Transform',category:'Shape',out:'shape',icon:'transform',description:'Translate, rotate and scale incoming paths.',inputs:[input('shape','shape')],bypass:'shape',params:{x:num('Position X',0,-1920,1920,1,'px'),y:num('Position Y',0,-1080,1080,1,'px'),scale:num('Scale',1,.1,4,.01,'×'),rotation:num('Rotation',0,-360,360,1,'°')}},
 copy:{name:'Copy',category:'Shape',out:'shape',icon:'copy',description:'Create actual path instances with independent spacing and scale.',inputs:[input('shape','shape')],bypass:'shape',params:{count:num('Count',6,1,12),scale:num('Scale step',.87,.4,1.4,.01,'×'),x:num('Step X',75,-300,300,1,'px'),y:num('Step Y',12,-300,300,1,'px'),rotation:num('Rotation step',0,-90,90,1,'°'),fade:num('Opacity step',.91,.2,1,.01)}},
 deform:{name:'Deform',category:'Shape',out:'shape',icon:'wave',description:'Move path points along their normals. Connect a Field to limit the effect.',inputs:[input('shape','shape'),input('mask','field',false)],bypass:'shape',params:{amount:num('Amount',27,0,160,1,'px'),frequency:num('Frequency',2.2,.1,10,.1),speed:num('Speed',.12,-1,1,.01,'Hz')}},
 radial:{name:'Radial Field',category:'Fields',out:'field',icon:'field',description:'A spatial mask and direction. Only connected nodes use this field.',inputs:[],params:{x:num('Position X',57,-50,150,1,'%'),y:num('Position Y',48,-50,150,1,'%'),radius:num('Radius',52,3,140,1,'%'),squash:num('Height ratio',.82,.2,2,.01,'×'),falloff:num('Falloff',.65,0,1,.01),core:num('Centre softness',.25,0,1,.01),strength:num('Strength',1,0,1,.01),invert:{label:'Invert',value:false,type:'boolean'}}},
 linear:{name:'Linear Field',category:'Fields',out:'field',icon:'linear',description:'A directional gradient mask in canvas space.',inputs:[],params:{x:num('Position X',50,-50,150,1,'%'),y:num('Position Y',50,-50,150,1,'%'),radius:num('Ramp width',65,3,150,1,'%'),angle:num('Direction',-25,-180,180,1,'°'),falloff:num('Softness',.7,0,1,.01),strength:num('Strength',1,0,1,.01),invert:{label:'Invert',value:false,type:'boolean'}}},
 palette:{name:'Gradient',category:'Colour',out:'palette',icon:'palette',description:'Map a shared value into colours. With no Value connected, use the regular image gradient.',inputs:[{...input('value','signal',false),label:'Colour mapping'}],params:{a:{label:'Shadow',value:'#071678',type:'color'},b:{label:'Midtone',value:'#147aff',type:'color'},c:{label:'Highlight',value:'#cbf8ff',type:'color'},offset:num('Offset',0,-1,1,.01)}},
 noise:{name:'Noise',category:'Values',out:'signal',icon:'wave',description:'One reusable, seeded smooth pattern. Sample it in space, along a path, per copy or uniformly. Connect Time to retime it independently.',inputs:[input('time','signal',false)],params:{domain:select('Sample by','spatial',['spatial','path','copy','uniform']),frequency:num('Frequency',1.8,.05,24,.05),speed:num('Evolution speed',.15,0,2,.01),seed:num('Seed',17,0,9999),octaves:num('Detail octaves',2,1,4),min:num('Minimum',0,-2000,2000,.01),max:num('Maximum',1,-2000,2000,.01),x:num('Pattern X',0,-1920,1920,1,'px'),y:num('Pattern Y',0,-1080,1080,1,'px')}},
 random:{name:'Random',category:'Values',out:'signal',icon:'signal',description:'Stable seeded values for each copy, path sample or spatial cell. Scrubbing and export do not reshuffle the result.',inputs:[],params:{domain:select('Sample by','copy',['copy','path','spatial','uniform']),seed:num('Seed',31,0,9999),min:num('Minimum',0,-2000,2000,.01),max:num('Maximum',1,-2000,2000,.01)}},
 math:{name:'Math',category:'Values',out:'signal',icon:'mix',description:'Combine reusable values or field weights. Multiply Noise by a field to localise its influence.',inputs:[input('a','signal',false),input('b','signal',false)],bypass:'a',params:{operation:select('Operation','multiply',['multiply','add','subtract','divide','min','max','power']),a:num('A fallback',1,-2000,2000,.01),b:num('B fallback',1,-2000,2000,.01)}},
 remap:{name:'Remap',category:'Values',out:'signal',icon:'linear',description:'Give a shared pattern a destination-specific range. The upstream Noise and every other connection stay independent.',inputs:[input('value','signal')],bypass:'value',params:{inMin:num('Input minimum',0,-2000,2000,.01),inMax:num('Input maximum',1,-2000,2000,.01),outMin:num('Output minimum',0,-2000,2000,.01),outMax:num('Output maximum',1,-2000,2000,.01),clamp:{label:'Clamp input',value:true,type:'boolean'},smooth:{label:'Smooth transition',value:false,type:'boolean'}}},
 time:{name:'Time',category:'Values',out:'signal',icon:'signal',description:'The same deterministic time used by playback, scrubbing and export. Drive evolution or a numeric parameter through Math and Remap.',inputs:[],params:{speed:num('Rate',1,-10,10,.01),offset:num('Offset',0,-100,100,.01,'s')}},
 displace:{name:'Displace',category:'Shape',out:'shape',icon:'wave',description:'Sample any connected value at each path point and displace it. Neutral value keeps the original contour; the optional field limits the effect.',inputs:[input('shape','shape'),input('value','signal',false),input('mask','field',false)],bypass:'shape',params:{amount:num('Amount',90,-300,300,1,'px'),midpoint:num('Neutral value',.5,-2,2,.01),direction:select('Direction','normal',['normal','x','y'])}},
 resample:{name:'Resample',category:'Shape',out:'shape',icon:'trim',description:'Add evenly spaced points before deformation, including along straight edges. Lower spacing gives finer detail at a higher evaluation cost.',inputs:[input('shape','shape')],bypass:'shape',params:{spacing:num('Point spacing',10,1,100,1,'px')}},
 lfo:{name:'LFO',category:'Motion',out:'signal',icon:'signal',description:'Drive numeric attributes with a repeating value. An optional Time input retimes this signal independently.',inputs:[input('time','signal',false)],params:{wave:select('Waveform','sine',['sine','triangle','pulse']),frequency:num('Frequency',.2,0,3,.01,'Hz'),amplitude:num('Amplitude',35,0,10000,1),offset:num('Centre value',0,-10000,10000,1),phase:num('Phase',0,0,360,1,'°')}},
 optical:{name:'Optical',category:'Light',out:'image',icon:'optical',description:'Render paths as luminous, bevelled strokes. This prototype uses a real Canvas renderer, not a static mockup.',inputs:[input('shape','shape'),input('palette','palette',false),input('field','field',false)],params:{glow:num('Light spread',38,0,120,1,'px'),strength:num('Glow intensity',.6,0,1,.01),body:num('Body opacity',.8,.05,1,.01),rim:num('Edge light',.85,0,1,.01),stretch:num('Field stretch',30,0,160,1,'px'),speed:num('Colour speed',.035,-.3,.3,.005,'Hz'),background:{label:'Background',value:'#070b22',type:'color'}}},
 mix:{name:'Mix',category:'Output',out:'image',icon:'mix',description:'Combine two rendered image branches. Shape data cannot connect here.',inputs:[input('a','image'),input('b','image',false)],bypass:'a',params:{amount:num('Mix amount',.5,0,1,.01)}},
 output:{name:'Output',category:'Output',out:'image',icon:'output',description:'The final image. Pin it to keep seeing the result while editing upstream nodes.',inputs:[input('image','image')],params:{}}
};
Object.assign(REGISTRY,EXTENSIONS,{shapes:SHAPES});
if (typeof ENABLE_TYPOGRAPHY !== 'undefined' && ENABLE_TYPOGRAPHY) {
  REGISTRY.typography = typographyNodeDefinition(num, select);
}
for(const kind of ['circle','rectangle','triangle','inlet'])REGISTRY[kind].hidden=true;
REGISTRY.optical.inputs.push(input('material','material',false),input('effects','effects',false),input('background','image',false));
REGISTRY.optical.params.renderer=select('Renderer','canvas',['canvas','gpu']);
REGISTRY.optical.description='Render editable paths as light, with optional material, background and procedural effect inputs.';
export const CATEGORIES=['Sources','Shape','Fields','Values','Colour','Motion','Materials','Effects','Light','Assets','Output'];
// These are evaluation domains, not UI-only animation flags. Counts and global
// modes stay uniform; numeric attributes with a spatial meaning can vary locally.
for(const [kind,definition] of Object.entries(REGISTRY))for(const [key,p]of Object.entries(definition.params))if(p.type==='number')p.sample=definition.out==='signal'?'context':definition.out==='material'||definition.out==='effects'?'point':['deform','displace','outline'].includes(kind)||kind==='palette'||kind==='optical'&&key!=='speed'?'point':['shapes','circle','rectangle','triangle','transform','trim','resample'].includes(kind)||kind==='copy'&&key!=='count'?'copy':'uniform';
const CANVAS_PARAMS={
 canvasX:{...num('Translate X',0,-1920,1920,1,'px'),section:'transform',sample:'copy'},
 canvasY:{...num('Translate Y',0,-1080,1080,1,'px'),section:'transform',sample:'copy'},
 canvasScale:{...num('Scale',1,.1,4,.01,'×'),section:'transform',sample:'copy'},
 canvasRotation:{...num('Rotate',0,-360,360,1,'°'),section:'transform',sample:'copy'}
};
const nativeTransforms=new Set(['shapes','path','svg','transform']);
REGISTRY.shapes.params.scale={...num('Scale',1,.1,4,.01,'×'),section:'transform',sample:'copy'};
for(const kind of ['shapes','path','svg'])for(const key of ['x','y','scale','rotation'])REGISTRY[kind].params[key].section='transform';
const shapeDefinitions=new Map();
export function nodeDefinition(node){
 const data=node?.data||node;if(!data)return {};
 let base=REGISTRY[data.kind]||{};
 if(data.kind==='inlet')base={...base,out:data.outputType||'shape'};
 if(data.kind==='group')base={...base,out:data.outputType||'shape',inputs:data.inputs||[],params:Object.fromEntries((data.exposed||[]).map(e=>[e.key,{...e.schema,label:e.label||e.schema.label}]))};
 if(base.out!=='shape'||nativeTransforms.has(data.kind))return base;
 if(data.kind!=='group'&&data.kind!=='inlet'&&shapeDefinitions.has(data.kind))return shapeDefinitions.get(data.kind);
 const result={...base,params:{...base.params,...CANVAS_PARAMS}};
 if(data.kind!=='group'&&data.kind!=='inlet')shapeDefinitions.set(data.kind,result);return result;
}
export function canvasTransformState(graph,id){const node=graph.nodes.find(n=>n.id===id);if(!node||nodeDefinition(node).out!=='shape')throw new Error('Select geometry to transform.');if(node.data.bypassed)throw new Error('Enable this node before editing its transform.');const native=nativeTransforms.has(node.data.kind),keys=native?{x:'x',y:'y',scale:'scale',rotation:'rotation'}:{x:'canvasX',y:'canvasY',scale:'canvasScale',rotation:'canvasRotation'},definition=nodeDefinition(node),params={},limits={};for(const [name,key]of Object.entries(keys)){params[name]=node.data.params[key]??definition.params[key].value;limits[name]=[definition.params[key].min,definition.params[key].max];}const driven=Object.keys(keys).filter(name=>graph.edges.some(e=>e.target===id&&e.targetHandle==='param:'+keys[name]));return {id,params,keys,limits,driven};}
export function updateCanvasTransform(graph,id,patch){const state=canvasTransformState(graph,id),values={};for(const [name,value]of Object.entries(patch)){if(!state.keys[name]||!Number.isFinite(value))throw new Error('Invalid transform value.');if(state.driven.includes(name))throw new Error('Disconnect this driven transform value before dragging it.');values[state.keys[name]]=clamp(value,...state.limits[name]);}return {...graph,nodes:graph.nodes.map(n=>n.id===id?{...n,data:{...n.data,params:{...n.data.params,...values}}}:n)};}

export function newNode(kind,position={x:0,y:0},id){
 const legacy=['circle','rectangle','triangle'].includes(kind)?kind:null;if(legacy)kind='shapes';
 if(!REGISTRY[kind])throw new Error('Unknown node type');
 const result={id:id||kind+'-'+crypto.randomUUID().slice(0,8),type:'effect',position,data:{kind,label:REGISTRY[kind].name,bypassed:false,params:Object.fromEntries(Object.entries(nodeDefinition({kind}).params).map(([k,p])=>[k,p.value]))}};
 if(legacy){Object.assign(result.data.params,Object.fromEntries(Object.entries(REGISTRY[legacy].params).map(([k,p])=>[k,p.value])));result.data.params.shape=legacy==='triangle'?'polygon':legacy;if(legacy==='triangle')result.data.params.sides=3;}
 if(kind==='path'||kind==='svg')result.data.paths=structuredClone(DEFAULT_PATH);
 if(kind==='group'){const source=newNode('circle',{x:0,y:0},'source');result.data.graph={version:1,name:'Group',nodes:[source],edges:[],preview:'source',duration:6};result.data.outputId='source';result.data.outputType='shape';result.data.inputs=[];result.data.exposed=[];}
 return result;
}
export function portType(node,handle){
 if(!node)return null;
 if(handle?.startsWith('param:'))return nodeDefinition(node)?.params[handle.slice(6)]?.type==='number'?'signal':null;
 return nodeDefinition(node)?.inputs.find(i=>i.id===handle)?.type||null;
}
export function compatibleTypes(out,type){return out===type||out==='field'&&type==='signal';}
export function validateConnection(graph,c,ignoreId){
 const from=graph.nodes.find(n=>n.id===c.source),to=graph.nodes.find(n=>n.id===c.target);
 if(!from||!to)return 'Both nodes must exist.';
 if(from.id===to.id)return 'A node cannot feed itself.';
 const type=portType(to,c.targetHandle),out=nodeDefinition(from).out;
 if(!compatibleTypes(out,type))return `${out[0].toUpperCase()+out.slice(1)} cannot connect to ${type||'this input'}.`;
 const seen=new Set(),stack=[to.id];
 while(stack.length){const id=stack.pop();if(id===from.id)return 'That connection would create a cycle.';if(seen.has(id))continue;seen.add(id);for(const e of graph.edges)if(e.id!==ignoreId&&e.source===id)stack.push(e.target);}
 return null;
}
export function connect(graph,c,ignoreId){
 const error=validateConnection(graph,c,ignoreId);if(error)throw new Error(error);
 const edge={id:'edge-'+crypto.randomUUID().slice(0,10),source:c.source,target:c.target,sourceHandle:'out',targetHandle:c.targetHandle};
 return {...graph,edges:[...graph.edges.filter(e=>e.id!==ignoreId&&!(e.target===c.target&&e.targetHandle===c.targetHandle)),edge]};
}
export function insertOnEdge(graph,edgeId,node){
 const edge=graph.edges.find(e=>e.id===edgeId);if(!edge)throw new Error('Connection no longer exists.');
 const primary=nodeDefinition(node).inputs.find(p=>p.required);
 const from=graph.nodes.find(n=>n.id===edge.source),out=nodeDefinition(from).out;
 if(!primary||!compatibleTypes(out,primary.type)||!compatibleTypes(nodeDefinition(node).out,portType(graph.nodes.find(n=>n.id===edge.target),edge.targetHandle)))throw new Error('This node cannot be inserted on that connection.');
 let result={...graph,nodes:[...graph.nodes,node],edges:graph.edges.filter(e=>e.id!==edgeId)};
 result=connect(result,{source:edge.source,target:node.id,targetHandle:primary.id});
 return connect(result,{source:node.id,target:edge.target,targetHandle:edge.targetHandle});
}
export function starter(name='Blue glass study'){
 const positions={circle:[0,80],outline:[205,80],trim:[410,80],copy:[615,80],deform:[820,80],optical:[1030,80],output:[1260,80],radial:[620,270],palette:[1030,330],lfo:[210,300]};
 const nodes=Object.entries(positions).map(([kind,[x,y]])=>newNode(kind,{x,y},kind+'1'));
 const edges=[];const wire=(s,t,h)=>edges.push({id:`${s}-${t}-${h}`,source:s+'1',target:t+'1',sourceHandle:'out',targetHandle:h});
 wire('circle','outline','shape');wire('outline','trim','shape');wire('trim','copy','shape');wire('copy','deform','shape');wire('deform','optical','shape');wire('palette','optical','palette');wire('radial','deform','mask');wire('radial','optical','field');wire('optical','output','image');
 return {version:1,name,nodes,edges,preview:'output1',duration:6};
}
export function sharedNoiseStudy(){
 const positions={circle:[0,30],outline:[210,30],copy:[420,30],displace:[660,30],optical:[1100,30],output:[1330,30],noise:[210,280],remap:[660,300],palette:[880,440],radial:[440,520]};
 let g={version:1,name:'One Noise · three uses',nodes:Object.entries(positions).map(([kind,[x,y]])=>newNode(kind,{x,y},kind+'1')),edges:[],preview:'output1',duration:12};
 const param=(kind,values)=>Object.assign(g.nodes.find(n=>n.id===kind+'1').data.params,values);
 param('circle',{radius:290,x:700});param('outline',{width:36});param('copy',{count:4,x:150,y:5,scale:.93});param('displace',{amount:210});param('noise',{frequency:1.5,speed:.17});param('remap',{outMin:.05,outMax:1});param('optical',{glow:65,body:.7,speed:0,stretch:0});param('radial',{x:60,y:50,radius:75});
 g.nodes.find(n=>n.id==='remap1').data.label='Glow range';
 for(const [source,target,targetHandle]of [['circle','outline','shape'],['outline','copy','shape'],['copy','displace','shape'],['displace','optical','shape'],['optical','output','image'],['noise','displace','value'],['noise','remap','value'],['remap','optical','param:strength'],['noise','palette','value'],['palette','optical','palette'],['radial','displace','mask']])g=connect(g,{source:source+'1',target:target+'1',targetHandle});
 return g;
}
export function cleanGraph(raw,depth=0){
 if(depth>6)throw new Error('Groups may be nested up to six levels.');
 if(!raw||raw.version!==1||!Array.isArray(raw.nodes)||!Array.isArray(raw.edges)||raw.nodes.length>60||raw.edges.length>160)throw new Error('Choose a Nodes Lab project (up to 60 nodes).');
 const ids=new Set();const nodes=raw.nodes.map(n=>{
  if(typeof n.id!=='string'||ids.has(n.id)||!REGISTRY[n.data?.kind])throw new Error('The project contains an invalid node.');ids.add(n.id);
  const out=newNode(n.data.kind,{x:clamp(Number(n.position?.x)||0,-10000,10000),y:clamp(Number(n.position?.y)||0,-10000,10000)},n.id);out.data.label=String(['circle','rectangle','triangle'].includes(n.data.kind)&&n.data.label===REGISTRY[n.data.kind].name?'Shapes':n.data.label||out.data.label).slice(0,60);out.data.bypassed=!!n.data.bypassed&&!!nodeDefinition(n).bypass;
  if(['path','svg'].includes(n.data.kind))out.data.paths=cleanPaths(n.data.paths||DEFAULT_PATH);
  if(n.data.kind==='bitmap'){if(typeof n.data.image!=='string'||n.data.image.length>5500000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(n.data.image))throw new Error('Invalid embedded image.');out.data.image=n.data.image;out.data.aspect=clamp(Number(n.data.aspect)||1,.05,20);}
  if(n.data.kind==='inlet'){out.data.inputId=String(n.data.inputId||'input').slice(0,100);out.data.outputType=Object.keys(TYPES).includes(n.data.outputType)?n.data.outputType:'shape';}
  if(n.data.kind==='group'){out.data.graph=cleanGraph(n.data.graph,depth+1);out.data.outputId=n.data.outputId||out.data.graph.preview;const source=out.data.graph.nodes.find(v=>v.id===out.data.outputId);if(!source)throw new Error('The group needs an output node.');out.data.outputType=nodeDefinition(source).out;out.data.inputs=(n.data.inputs||[]).slice(0,32).map(v=>{if(typeof v.id!=='string'||!Object.keys(TYPES).includes(v.type))throw new Error('Invalid group input.');return {id:v.id.slice(0,100),type:v.type,required:!!v.required,label:String(v.label||v.id).slice(0,60)};});out.data.exposed=(n.data.exposed||[]).slice(0,32).map(e=>{const target=out.data.graph.nodes.find(v=>v.id===e.nodeId),schema=target&&nodeDefinition(target).params?.[e.param];if(!schema||schema.type!=='number')throw new Error('Invalid exposed parameter.');return {key:String(e.key).slice(0,50),nodeId:e.nodeId,param:e.param,label:String(e.label||schema.label).slice(0,60),schema:{...schema}};});}
  for(const [key,def]of Object.entries(nodeDefinition(out).params)){const val=n.data.params?.[key];if(def.type==='number'&&Number.isFinite(val))out.data.params[key]=clamp(val,def.min,def.max);else if(def.type==='color'&&/^#[a-f0-9]{6}$/i.test(val))out.data.params[key]=val;else if(def.type==='select'&&def.options.includes(val))out.data.params[key]=val;else if(def.type==='boolean'&&typeof val==='boolean')out.data.params[key]=val;}
  return out;
 });
 let graph={version:1,name:String(raw.name||'Untitled study').slice(0,80),nodes,edges:[],duration:clamp(Number(raw.duration)||6,1,30),preview:ids.has(raw.preview)?raw.preview:nodes.find(n=>n.data.kind==='output')?.id||nodes.at(-1)?.id};
 for(const e of raw.edges)graph=connect(graph,e);
 return graph;
}
function bounds(shapes){let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;for(const shape of shapes)for(const [x,y]of shape.points){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}return Number.isFinite(left)?[(left+right)/2,(top+bottom)/2]:[W/2,H/2];}
function transformShapes(shapes,{x=0,y=0,scale=1,rotation=0},origin=bounds(shapes)){
 const a=rotation*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
 const point=([px,py])=>{const dx=(px-origin[0])*scale,dy=(py-origin[1])*scale;return [origin[0]+dx*c-dy*sn+x,origin[1]+dx*sn+dy*c+y];};
 return shapes.map(s=>({...s,width:s.width*scale,widthScale:(s.widthScale||1)*scale,origin:point(s.origin||origin),points:s.points.map(point)}));
}
function trimShape(s,start,end,offset){
 let span=(end-start)/100;if(span<0)span+=1;if(Math.abs(end-start)>=100)span=1;if(span<.00001)return {...s,points:[],closed:false};
 if(span>=.99999)return s;
 const pts=s.closed?[...s.points,s.points[0]]:s.points,dist=[0];for(let i=1;i<pts.length;i++)dist.push(dist.at(-1)+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const len=dist.at(-1)||1;
 const at=t=>{const d=((t%1+1)%1)*len;let j=1;while(j<dist.length-1&&dist[j]<d)j++;const f=(d-dist[j-1])/(dist[j]-dist[j-1]||1);return [pts[j-1][0]+(pts[j][0]-pts[j-1][0])*f,pts[j-1][1]+(pts[j][1]-pts[j-1][1])*f];};
 const n=Math.max(12,Math.ceil(s.points.length*span));return {...s,points:Array.from({length:n+1},(_,i)=>at(start/100+offset/360+span*i/n)),closed:false};
}
function resampleShape(shape,spacing){
 if(shape.points.length<2)return shape;const points=shape.closed?[...shape.points,shape.points[0]]:shape.points,dist=[0];
 for(let i=1;i<points.length;i++)dist.push(dist.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 const length=dist.at(-1),segments=Math.max(2,Math.ceil(length/spacing));if(segments>4096)throw new Error('Resample limit: increase Point spacing (4096 points per path).');
 let j=1;const result=Array.from({length:segments+(shape.closed?0:1)},(_,i)=>{const d=i/segments*length;while(j<dist.length-1&&dist[j]<d)j++;const a=points[j-1],b=points[j],t=(d-dist[j-1])/(dist[j]-dist[j-1]||1);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];});return {...shape,points:result};
}
export const fieldAt=fieldSample;
export function createEvaluator(){
 const entries=new Map(),groupEngines=new Map();let previousNodes,previousEdges,map,inputs,contextual;
 return {evaluate(graph,target=graph.preview,time=0,options=typeof graph.evaluationOptions==='function'?graph.evaluationOptions(time):graph.evaluationOptions||{}){
  if(graph.nodes!==previousNodes||graph.edges!==previousEdges){
   previousNodes=graph.nodes;previousEdges=graph.edges;map=new Map(graph.nodes.map(n=>[n.id,n]));inputs=new Map();
   for(const e of graph.edges){if(!inputs.has(e.target))inputs.set(e.target,new Map());inputs.get(e.target).set(e.targetHandle,e);}
   for(const [key,entry]of entries)if(!map.has(entry.nodeId))entries.delete(key);
   const valueContexts=new Map(),valueContext=(id,seen=new Set())=>{if(valueContexts.has(id))return valueContexts.get(id);if(seen.has(id))return false;seen.add(id);const n=map.get(id),kind=n?.data.kind;const v=['radial','linear','box','shapeField'].includes(kind)||['noise','random'].includes(kind)&&n.data.params.domain!=='uniform'||[...(inputs.get(id)?.values()||[])].some(e=>valueContext(e.source,new Set(seen)));valueContexts.set(id,v);return v;};
   contextual=new Map();const walk=(id,seen=new Set())=>{
    if(contextual.has(id))return contextual.get(id);if(seen.has(id))return false;seen.add(id);
    const node=map.get(id),d=nodeDefinition(node);if(!d||d.out!=='shape')return false;
    const edges=[...(inputs.get(id)?.values()||[])],result=node.data.kind==='group'||edges.some(e=>(e.targetHandle.startsWith('param:')||e.targetHandle==='value')&&valueContext(e.source)||nodeDefinition(map.get(e.source))?.out==='shape'&&walk(e.source,new Set(seen)));
    contextual.set(id,result);return result;
   };for(const id of map.keys())walk(id);
  }
  return evaluateGraph(graph,target,time,{entries,map,inputs,contextual,groupEngines,options});
 }};
}
export function evaluate(graph,target=graph.preview,time=0,options=typeof graph.evaluationOptions==='function'?graph.evaluationOptions(time):graph.evaluationOptions||{}){return createEvaluator().evaluate(graph,target,time,options);}
function evaluateGraph(graph,target,time,{entries,map,inputs,contextual,groupEngines,options}){
 const cache=new Map(),local=new Map(),visiting=new Set(),animated=new Map(),root={...ROOT_CONTEXT,...options.context,time},namespace=options.namespace||'',rootGraph=options.rootGraph||graph,rootTarget=options.rootTarget||target,external=options.external||{};
 const get=(id,context=root)=>{
  const key=contextual.get(id)?id+'@'+context.instance+':'+context.index+':'+context.count+':'+context.position.join(','):id;
  if(local.has(key))return local.get(key);const node=map.get(id);if(!node)throw new Error('Select a node to preview.');if(visiting.has(id))throw new Error('Cycle detected.');visiting.add(id);
  const d=nodeDefinition(node),params={...Object.fromEntries(Object.entries(d.params).map(([k,p])=>[k,p.value])),...node.data.params},bindings={},edgeAt=h=>inputs.get(id)?.get(h);
  const read=(h,required=false,ctx=context)=>{const e=edgeAt(h);if(!e){if(required)throw new Error(`${node.data.label}: ${h} input required.`);return null;}return get(e.source,ctx);};
  for(const [k,def]of Object.entries(d.params)){if(kindForParameters(node)==='shapes'&&!parameterVisible(def,params))continue;const e=edgeAt('param:'+k);if(e){bindings[k]=get(e.source);params[k]=clamp(sampleSignal(bindings[k],context),def.min,def.max);}}
  const samplers=Object.fromEntries(Object.entries(bindings).map(([k,v])=>[k,signalFunction(v)]));
  const at=(key,ctx)=>samplers[key]?clamp(samplers[key](ctx),d.params[key].min,d.params[key].max):params[key];
  const finish=out=>{visiting.delete(id);local.set(key,out);cache.set(id,out);return out;};
  if(node.data.bypassed&&d.bypass){let out=read(d.bypass);if(d.out==='signal'&&(!out||out.type==='field')){const source=out;out={type:'signal',op:'math',params:{operation:'add',a:params.a??0,b:0},bindings:source?{}:bindings,limits:{},inputs:source?{a:source}:{},domain:source?signalDomain(source):signalDomain(bindings.a),animated:!!animated.get(edgeAt('param:a')?.source)};out.value=sampleSignal(out,context);}if(!out)throw new Error(`${node.data.label}: ${d.bypass} input required.`);animated.set(id,animated.get(edgeAt(d.bypass)?.source)||!!out.animated);return finish(out);}
  for(const p of d.inputs)if(p.required&&!edgeAt(p.id))throw new Error(`${node.data.label}: ${p.id} input required.`);
  const dependencyValues=[...(node.data.kind==='inlet'?[external[node.data.inputId]]:[]),...d.inputs.map(port=>read(port.id,port.required)),...Object.values(bindings)];
  const p=params,kind=node.data.kind;
  const changesWithTime=(kind==='lfo'&&!edgeAt('time')&&p.frequency!==0&&p.amplitude!==0)||(kind==='time'&&p.speed!==0)||(kind==='noise'&&!edgeAt('time')&&p.speed!==0&&p.min!==p.max)||(kind==='deform'&&p.speed!==0&&p.amount!==0)||kind==='fluid'||(kind==='contourPulse'&&p.frequency!==0)||(kind==='venetian'&&(p.speed!==0||p.timeDisplacement!==0));
  const isAnimated=changesWithTime||(kind==='optical'&&p.speed!==0)||[...(inputs.get(id)?.values()||[])].some(e=>animated.get(e.source));animated.set(id,isAnimated);
  const previous=entries.get(key);
  if(previous&&previous.data===node.data&&(!changesWithTime||previous.time===time)&&!(kind==='group'&&previous.animated&&previous.time!==time)&&dependencyValues.length===previous.dependencies.length&&dependencyValues.every((v,i)=>v===previous.dependencies[i])){countMetric('cache hits');if(kind==='group')animated.set(id,previous.animated||isAnimated);return finish(previous.value);}
  countMetric('computed nodes');let out;
  if(kind==='shapes'){const shape=primitiveGeometry(p,(key,position,u)=>at(key,{...context,position,u}));out={type:'shape',shapes:[{...shape,copy:context.index,count:context.count,instance:context.instance,objectInstance:namespace+id+context.instance}]};}
  else if(kind==='inlet'){out=external[node.data.inputId];if(!out)throw new Error(`${node.data.label}: connect its group input.`);}
  else if(kind==='group'){
   let engine=groupEngines.get(node.data);if(!engine){engine=createEvaluator();groupEngines.set(node.data,engine);if(groupEngines.size>80)groupEngines.delete(groupEngines.keys().next().value);}
   const values=Object.fromEntries(d.inputs.map(port=>[port.id,read(port.id,port.required)]));for(const exposed of node.data.exposed||[])values['param:'+exposed.key]=bindings[exposed.key]||{type:'signal',value:p[exposed.key],domain:'uniform'};
   const result=engine.evaluate(node.data.graph,node.data.outputId,time,{context,external:values,rootGraph,rootTarget,namespace:namespace+id+'/'});if(result.error)throw new Error(node.data.label+': '+result.error);out=result.value;animated.set(id,result.animated||isAnimated);
  }else if(kind==='path'||kind==='svg')out={type:'shape',shapes:transformShapes(samplePaths(node.data.paths||DEFAULT_PATH).map(s=>({...s,objectInstance:namespace+id+context.instance})),p)};
  else if(kind==='bitmap')out={type:'image',background:'#070b22',layers:[{kind:'bitmap',id:namespace+id,image:node.data.image,aspect:node.data.aspect||1,params:p,bindings,opacity:1}]};
  else if(kind==='glass')out={type:'material',kind,params:p,bindings,mask:read('mask')};
  else if(d.out==='effects')out={type:'effects',items:[...(read('effects')?.items||[]),{kind,id:namespace+id,params:p,bindings,mask:read('mask'),time:read('time')}]};
  else if(kind==='box')out={type:'field',kind,x:W*p.x/100,y:H*p.y/100,rx:H*p.width/200,ry:H*p.height/200,angle:p.angle,falloff:p.falloff,core:0,strength:p.strength,invert:p.invert};
  else if(kind==='shapeField'){const source=read('shape',true),centre=bounds(source.shapes);out={type:'field',kind,shapes:source.shapes,x:centre[0],y:centre[1],rx:p.reach,ry:p.reach,reach:p.reach,mode:p.mode,strength:p.strength,invert:p.invert,falloff:1,core:0};}
  else if(['circle','rectangle','triangle'].includes(kind)){
   let points=[];
   if(kind==='circle')points=Array.from({length:256},(_,i)=>[p.x+Math.cos(i/256*Math.PI*2)*p.radius,p.y+Math.sin(i/256*Math.PI*2)*p.radius]);
   if(kind==='triangle'){const v=Array.from({length:3},(_,i)=>[p.x+Math.cos(-Math.PI/2+i*Math.PI*2/3)*p.radius,p.y+Math.sin(-Math.PI/2+i*Math.PI*2/3)*p.radius]);for(let j=0;j<3;j++)for(let i=0;i<64;i++){const t=i/64;points.push([v[j][0]*(1-t)+v[(j+1)%3][0]*t,v[j][1]*(1-t)+v[(j+1)%3][1]*t]);}}
   if(kind==='rectangle'){const r=Math.min(p.corner,p.width/2,p.height/2);for(let j=0;j<4;j++){const cx=p.x+([1,-1,-1,1][j])*(p.width/2-r),cy=p.y+([1,1,-1,-1][j])*(p.height/2-r);for(let i=0;i<48;i++){const a=j*Math.PI/2+i/47*Math.PI/2;points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}}}
   out={type:'shape',shapes:[{points,width:0,fill:true,closed:true,opacity:1,copy:context.index,count:context.count,instance:context.instance,origin:[p.x,p.y]}]};
  }else if(kind==='outline')out={type:'shape',shapes:read('shape',true).shapes.map(s=>({...s,width:at('width',shapeContext(s,time)),widthSource:bindings.width&&signalDomain(bindings.width)!=='uniform'?bindings.width:undefined,widthScale:1,fill:false}))};
  else if(kind==='trim')out={type:'shape',shapes:read('shape',true).shapes.map(s=>{const c=shapeContext(s,time);return trimShape(s,at('start',c),at('end',c),at('offset',c));})};
  else if(kind==='resample'){
   const shapes=read('shape',true).shapes.map(s=>resampleShape(s,at('spacing',shapeContext(s,time))));if(shapes.reduce((n,s)=>n+s.points.length,0)>65536)throw new Error('Resample limit: increase Point spacing (65536 points total).');out={type:'shape',shapes};
  }else if(kind==='transform'){
   const shapes=read('shape',true).shapes;
   out={type:'shape',shapes:Object.keys(bindings).length?shapes.flatMap(s=>{const c=shapeContext(s,time),p=Object.fromEntries(Object.keys(params).map(k=>[k,at(k,c)]));return transformShapes([s],p);}):transformShapes(shapes,p)};
  }else if(kind==='copy'){
   const shapes=read('shape',true).shapes,c=bounds(shapes),count=Math.round(p.count);
   if(shapes.length*count>128)throw new Error('Copy limit: reduce the count to keep this prototype responsive (128 paths).');
   out={type:'shape',shapes:Array.from({length:count},(_,i)=>{
    const ctx={...context,position:[c[0]+p.x*i,c[1]+p.y*i],index:context.index*count+i,count:context.count*count,instance:context.instance+'/'+id+':'+i};
    const values=Object.fromEntries(Object.keys(p).map(k=>[k,k==='count'?count:at(k,ctx)]));
    ctx.position=[c[0]+values.x*i,c[1]+values.y*i];
    const source=contextual.get(edgeAt('shape').source)?read('shape',true,ctx).shapes:shapes;
    return transformShapes(source,{x:values.x*i,y:values.y*i,scale:values.scale**i,rotation:values.rotation*i},c).map((s,j)=>({...s,copy:ctx.index*source.length+j,count:ctx.count*source.length,instance:ctx.instance+'/'+j,objectInstance:ctx.instance,opacity:s.opacity*values.fade**i}));
   }).flat()};
  }else if(kind==='deform'||kind==='displace'){
   const source=read('shape',true),f=read('mask'),value=kind==='displace'?read('value'):null,sample=signalFunction(value),needsU=signalUses(value,'path')||Object.values(bindings).some(v=>signalUses(v,'path'));
   out={type:'shape',shapes:source.shapes.map(s=>{const c=shapeContext(s,time),u=needsU?pathCoordinates(s):null;return {...s,points:s.points.map((pt,i,arr)=>{
    c.position=pt;c.u=u?u[i]:0;
    const prev=arr[s.closed?(i-1+arr.length)%arr.length:Math.max(0,i-1)],next=arr[s.closed?(i+1)%arr.length:Math.min(arr.length-1,i+1)],dx=next[0]-prev[0],dy=next[1]-prev[1],length=Math.hypot(dx,dy)||1,w=f?fieldAt(f,pt).weight:1;
    const a=kind==='displace'?(value?(sample(c)-at('midpoint',c))*at('amount',c)*w:0):Math.sin((pt[0]+pt[1])*.006*at('frequency',c)+time*at('speed',c)*Math.PI*2)*at('amount',c)*w;
    return p.direction==='x'?[pt[0]+a,pt[1]]:p.direction==='y'?[pt[0],pt[1]+a]:[pt[0]+dy/length*a,pt[1]-dx/length*a];
   })}})};
  }else if(kind==='radial'||kind==='linear')out={type:'field',kind,x:W*p.x/100,y:H*p.y/100,rx:H*p.radius/100,ry:H*p.radius/100*(p.squash||1),falloff:p.falloff,core:p.core||0,strength:p.strength,invert:p.invert,angle:p.angle||0};
  else if(kind==='palette')out={type:'palette',colors:[p.a,p.b,p.c],offset:p.offset,mapping:read('value'),offsetSource:bindings.offset};
  else if(d.out==='signal'){
   const scalarInputs=Object.fromEntries(d.inputs.map(i=>[i.id,read(i.id)]).filter(([,v])=>v)),domains=[...Object.values(scalarInputs),...Object.values(bindings)].map(signalDomain);
   for(const value of [...Object.values(scalarInputs),...Object.values(bindings)])if(value.contexts)domains.push(...value.contexts);if(['noise','random'].includes(kind))domains.push(p.domain);
   const domain=domains.includes('spatial')?'spatial':domains.includes('path')?'path':domains.includes('copy')?'copy':'uniform';
   out={type:'signal',op:kind,params:{...node.data.params},bindings,limits:Object.fromEntries(Object.entries(d.params).filter(([,v])=>v.type==='number').map(([k,v])=>[k,[v.min,v.max]])),inputs:scalarInputs,domain,contexts:[...new Set(domains)],animated:!!isAnimated};out.value=sampleSignal(out,context);
  }else if(kind==='optical'||kind==='fluid'){
   const shape=read('shape',true),palette=read('palette')||{colors:['#071678','#147aff','#cbf8ff'],offset:0},field=read('field');
   out={type:'image',background:p.background,layers:[{id:namespace+id,kind,shapes:shape.shapes,palette,field,material:kind==='optical'?read('material'):null,effects:read('effects')?.items||[],backgroundImage:read('background'),geometryAnimated:!!animated.get(edgeAt('shape')?.source),params:p,bindings,opacity:1}]};
  }else if(kind==='mix'){
   const a=read('a',true),b=read('b');out=b?{type:'image',background:a.background,layers:[...a.layers.map(l=>copyImageLayer(l,l.opacity*(1-p.amount))),...b.layers.map(l=>copyImageLayer(l,l.opacity*p.amount))]}:a;
  }else if(kind==='output')out=read('image',true);
  else if(kind==='typography' && ENABLE_TYPOGRAPHY){
   const shapes = textToShapes({
     text: p.text,
     size: p.size,
     tracking: p.tracking,
     wordSpacing: p.wordSpacing,
     lineSpacing: p.lineSpacing,
     paragraphSpacing: p.paragraphSpacing,
     align: p.align,
     verticalAlign: p.verticalAlign,
     boxWidth: p.boxWidth,
     x: p.x,
     y: p.y,
     rotation: p.rotation,
     allCaps: p.allCaps
   });
   out = { type: 'shape', shapes: shapes.map(sh => ({
     ...sh,
     copy: context.index,
     count: context.count,
     instance: (context.instance || '') + '/char' + (sh.charIndex ?? 0)
   })) };
  }
  if(out?.type==='shape'&&!nativeTransforms.has(kind)){
   const active=Object.entries(CANVAS_PARAMS).some(([key,def])=>bindings[key]||p[key]!==def.value);
   if(active){const resolved=c=>({x:at('canvasX',c),y:at('canvasY',c),scale:at('canvasScale',c),rotation:at('canvasRotation',c)}),local=Object.keys(CANVAS_PARAMS).some(key=>bindings[key]);out={...out,shapes:local?out.shapes.flatMap(s=>transformShapes([s],resolved(shapeContext(s,time)))):transformShapes(out.shapes,resolved(context))};}
  }
  if((kind==='optical'||kind==='fluid')&&out?.layers?.[0])renderTimelines.set(out.layers[0],{graph:rootGraph,target:rootTarget,id:namespace+id});
  entries.set(key,{nodeId:id,data:node.data,dependencies:dependencyValues,time,value:out,animated:!!animated.get(id)});return finish(out);
 };
 try{const value=get(target);return {value,cache,animated:!!animated.get(target),error:null};}catch(error){return {value:null,cache,error:error.message};}
}
export function createHistory(initial,limit=75){let states=[structuredClone(initial)],index=0;return {record(next){const a=JSON.stringify(states[index]),b=JSON.stringify(next);if(a===b)return;states.splice(index+1);states.push(structuredClone(next));if(states.length>limit)states.shift();index=states.length-1;},undo(){return index>0?structuredClone(states[--index]):null;},redo(){return index<states.length-1?structuredClone(states[++index]):null;},canUndo(){return index>0;},canRedo(){return index<states.length-1;}};}

function copyImageLayer(layer,opacity){const out={...layer,opacity};if(renderTimelines.has(layer))renderTimelines.set(out,renderTimelines.get(layer));return out;}

function kindForParameters(node){return node.data.kind;}
