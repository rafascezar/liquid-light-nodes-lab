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
REGISTRY.shapes.params.scale={...num('Scale',1,.1,4,.01,'×'),section:'transform',sample:'copy'};
for(const kind of ['shapes','path','svg'])for(const key of ['x','y','scale','rotation'])REGISTRY[kind].params[key].section='transform';

export function nodeDefinition(node){
 let base=REGISTRY[data.kind]||{};
 const d={...base,params:{...base.params}};
 if(data.kind==='group'){
  const ports=data.ports||[];
  d.inputs=ports.filter(p=>p.direction==='in').map(p=>({id:p.id,type:p.type,required:false,label:p.label}));
  d.out=ports.find(p=>p.direction==='out')?.type||'shape';
  d.params={};
 }
 return d;
}

export function canvasTransformState(graph,id){const node=graph.nodes.find(n=>n.id===id);if(!node||nodeDefinition(node).out!=='shape')throw new Error('Select geometry to transform.');if(node.data.bypassed)throw new Error('Enable this node before editing its transform.');const native=nativeTransforms.has(node.data.kind),keys=native?{x:'x',y:'y',scale:'scale',rotation:'rotation'}:{x:'canvasX',y:'canvasY',scale:'canvasScale',rotation:'canvasRotation'},definition=nodeDefinition(node),params={},limits={};for(const [name,key]of Object.entries(keys)){params[name]=node.data.params[key]??definition.params[key]?.value??(name==='scale'?1:0);limits[name]=definition.params[key]?[definition.params[key].min,definition.params[key].max]:name==='scale'?[.05,20]:[-4000,4000];}return {keys,params,limits};}

const nativeTransforms=new Set(['shapes','path','svg','typography']);
const CANVAS_PARAMS={canvasX:num('Canvas X',0,-4000,4000,1,'px'),canvasY:num('Canvas Y',0,-4000,4000,1,'px'),canvasScale:num('Canvas Scale',1,.05,20,.01,'×'),canvasRotation:num('Canvas Rotation',0,-360,360,1,'°')};
for(const [kind,definition] of Object.entries(REGISTRY))if(definition.out==='shape'&&!nativeTransforms.has(kind))Object.assign(definition.params,CANVAS_PARAMS);

function bounds(shapes){let min=[1e9,1e9],max=[-1e9,-1e9];for(const s of shapes)for(const p of s.points){min[0]=Math.min(min[0],p[0]);min[1]=Math.min(min[1],p[1]);max[0]=Math.max(max[0],p[0]);max[1]=Math.max(max[1],p[1]);}return [(min[0]+max[0])/2,(min[1]+max[1])/2];}
function transformShapes(shapes,{x=0,y=0,scale=1,rotation=0},origin=bounds(shapes)){const a=rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return shapes.map(sh=>({...sh,points:sh.points.map(([px,py])=>{const dx=px-origin[0],dy=py-origin[1];return [origin[0]+(dx*c-dy*s)*scale+x,origin[1]+(dx*s+dy*c)*scale+y];})}));}

export function createEvaluator(){
 const cache=new Map(),inputs=new Map(),groupEngines=new WeakMap();
 return {evaluate,invalidate:()=>cache.clear(),setInputs:edges=>{inputs.clear();for(const e of edges){if(!inputs.has(e.target))inputs.set(e.target,new Map());inputs.get(e.target).set(e.targetHandle,e);}}};
 function evaluate(graph,id,time=0,context=ROOT_CONTEXT,external={},namespace='',seen=new Set()){
  const key=namespace+id+'@'+time+'/'+context.instance;
  if(cache.has(key))return cache.get(key);
  if(seen.has(id))throw new Error('Cycle detected');
  seen.add(id);
  const node=graph.nodes.find(n=>n.id===id);if(!node)throw new Error('Missing node');
  const d=nodeDefinition(node),params={...Object.fromEntries(Object.entries(d.params).map(([k,p])=>[k,p.value])),...node.data.params},bindings={},edgeAt=h=>inputs.get(id)?.get(h);
  const at=(key,c=context)=>{const edge=edgeAt('param:'+key);if(!edge)return params[key];const value=evaluate(graph,edge.source,time,c,external,namespace,new Set(seen)).value;bindings[key]=value;return sampleSignal(value,c);};
  const read=(handle,required=false)=>{const edge=edgeAt(handle);if(!edge){if(required)throw new Error(node.data.label+': connect its '+handle+' input.');return null;}return evaluate(graph,edge.source,time,context,external,namespace,new Set(seen)).value;};
  const fieldAt=(field,pt)=>fieldSample(field,pt);
  let out,isAnimated=false;
  const kind=node.data.kind;
  if(node.data.bypassed&&d.bypass){const source=read(d.bypass,true);out=source;}
  else if(kind==='inlet'){out=external[node.data.inputId];if(!out)throw new Error(`${node.data.label}: connect its group input.`);}
  else if(kind==='group'){
   let engine=groupEngines.get(node.data);if(!engine){engine=createEvaluator();groupEngines.set(node.data,engine);}
   const childEdges=node.data.graph.edges.filter(e=>e.target!=='group-out');
   engine.setInputs(childEdges);
   const ext={};for(const port of node.data.ports.filter(p=>p.direction==='in'))ext[port.id]=read(port.id);
   const outlet=node.data.graph.edges.find(e=>e.target==='group-out');
   if(!outlet)throw new Error(node.data.label+': connect a node to Group Output.');
   out=engine.evaluate(node.data.graph,outlet.source,time,context,ext,namespace+id+'/',new Set()).value;
  }
  else if(kind==='path'||kind==='svg')out={type:'shape',shapes:transformShapes(samplePaths(node.data.paths||DEFAULT_PATH).map(s=>({...s,objectInstance:namespace+id+context.instance})),p)};
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
   const source=read('shape',true),values=Object.fromEntries(['x','y','scale','rotation'].map(k=>[k,at(k,context)]));
   out={type:'shape',shapes:transformShapes(source.shapes,values)};
  }else if(kind==='copy'){
   const source=read('shape',true).shapes,count=Math.max(1,Math.round(at('count'))),values=Object.fromEntries(['x','y','scale','rotation','fade'].map(k=>[k,at(k,context)]));
   out={type:'shape',shapes:Array.from({length:count},(_,i)=>{
    const ctx={...context,index:i,count,instance:(context.instance||'')+'/'+i};
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
   out={type:'image',background:p.background||'#070b22',layers:[{kind,id:namespace+id,shapes:shape.shapes,palette,field,params:p,bindings,opacity:1}]};
  }else if(kind==='mix'){
   const a=read('a',true),b=read('b');out={type:'image',background:a.background,layers:[...a.layers,...(b?.layers||[])],mix:p.amount};
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
  }else if(kind==='shapes'){
   const shapes=primitiveGeometry(p,(key,pt,u)=>at(key,{...context,position:pt,u}));
   out={type:'shape',shapes:Object.keys(bindings).length?shapes.flatMap(s=>{const c=shapeContext(s,time),p=Object.fromEntries(Object.keys(params).map(k=>[k,at(k,c)]));return transformShapes([s],p);}):transformShapes(shapes,p)};
  }else throw new Error('Unsupported node: '+kind);
  const active=Object.keys(CANVAS_PARAMS).some(key=>params[key]!==undefined);
  if(active&&out?.type==='shape'){const resolved=c=>({x:at('canvasX',c),y:at('canvasY',c),scale:at('canvasScale',c),rotation:at('canvasRotation',c)}),local=Object.keys(CANVAS_PARAMS).some(key=>bindings[key]);out={...out,shapes:local?out.shapes.flatMap(s=>transformShapes([s],resolved(shapeContext(s,time)))):transformShapes(out.shapes,resolved(context))};}
  const result={value:out,animated:isAnimated};
  cache.set(key,result);
  return result;
 }
}

function trimShape(shape,start,end,offset){const len=shape.points.length,a=((start+offset)/100*len)|0,b=((end+offset)/100*len)|0;return {...shape,points:shape.points.slice(Math.min(a,b),Math.max(a,b)+1),closed:false};}
function resampleShape(shape,spacing){const points=[],pts=shape.points;for(let i=0;i<pts.length-(shape.closed?0:1);i++){const a=pts[i],b=pts[(i+1)%pts.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(d/spacing));for(let k=0;k<n;k++)points.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}if(!shape.closed)points.push(pts.at(-1));return {...shape,points};}
