import {shapeDistance} from './field-distance.js';
// Serializable procedural values. Consumers supply the sampling context; generators
// never contain geometry- or renderer-specific branches. The compiled closures are
// kept outside the document/evaluation data, so projects remain plain JSON.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*t*(t*(t*6-15)+10);
const compiled=new WeakMap();
const coordinates=new WeakMap();
export const ROOT_CONTEXT={position:[960,540],index:0,count:1,u:0,time:0,instance:''};
function hash(x,y,z,seed){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,2147483647)^Math.imul(seed|0,1274126177);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function noise3(x,y,z,seed){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),a=smooth(x-ix),b=smooth(y-iy),c=smooth(z-iz);
 return mix(mix(mix(hash(ix,iy,iz,seed),hash(ix+1,iy,iz,seed),a),mix(hash(ix,iy+1,iz,seed),hash(ix+1,iy+1,iz,seed),a),b),mix(mix(hash(ix,iy,iz+1,seed),hash(ix+1,iy,iz+1,seed),a),mix(hash(ix,iy+1,iz+1,seed),hash(ix+1,iy+1,iz+1,seed),a),b),c);
}
export function fieldSample(f,position){
 if(f.kind==='shapeField'){const v=shapeDistance(f.shapes,position),r=f.mode==='edge'?Math.abs(v.distance):Math.max(0,v.distance),z=clamp(r/Math.max(1,f.reach),0,1),w=(1-z*z*(3-2*z))*f.strength;return {weight:f.invert?f.strength-w:w,normal:v.normal,core:1};}
 if(f.kind==='box'){const angle=(f.angle||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),dx=position[0]-f.x,dy=position[1]-f.y,x=dx*c+dy*s,y=-dx*s+dy*c,qx=Math.abs(x)-f.rx,qy=Math.abs(y)-f.ry,d=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0),z=clamp(-d/Math.max(.001,Math.min(f.rx,f.ry)*f.falloff),0,1),weight=z*z*(3-2*z)*f.strength;let nx=qx>qy?Math.sign(x):0,ny=qy>=qx?Math.sign(y):0;if(qx>0&&qy>0){const l=Math.hypot(qx,qy);nx=qx/l*Math.sign(x);ny=qy/l*Math.sign(y);}return {weight:f.invert?f.strength-weight:weight,normal:[nx*c-ny*s,nx*s+ny*c],core:1};}
 const dx=position[0]-f.x,dy=position[1]-f.y;let r,n,t;
 if(f.kind==='linear'){const a=f.angle*Math.PI/180;n=[Math.cos(a),Math.sin(a)];t=clamp(.5+(dx*n[0]+dy*n[1])/(f.rx*2),0,1);t=t*(1-f.falloff)+t*t*(3-2*t)*f.falloff;r=1;}
 else{r=Math.hypot(dx/f.rx,dy/f.ry);const inner=1-f.falloff,z=clamp((r-inner)/Math.max(f.falloff,.0001),0,1);t=1-z*z*(3-2*z);const l=Math.hypot(dx/f.rx**2,dy/f.ry**2)||1;n=[dx/f.rx**2/l,dy/f.ry**2/l];}
 const core=f.core>0&&f.kind==='radial'?clamp(r/f.core,0,1):1;
 return {weight:(f.invert?1-t:t)*f.strength,normal:n.map(v=>v*(f.invert?-1:1)),core:core*core*(3-2*core)};
}
export function signalFunction(value){
 if(typeof value==='number')return ()=>value;
 if(!value)return ()=>0;
 if(compiled.has(value))return compiled.get(value);
 if(value.type==='field'){const fn=c=>fieldSample(value,c.position||ROOT_CONTEXT.position).weight;compiled.set(value,fn);return fn;}
 const p=value.params||{},drivers=value.bindings||{},defs=value.limits||{},inputs=value.inputs||{};
 const fs=Object.fromEntries(Object.entries(drivers).map(([k,v])=>[k,signalFunction(v)]));
 const get=(key,c)=>{if(!fs[key])return p[key];const v=fs[key](c),limits=defs[key];return limits?clamp(v,limits[0],limits[1]):v;};
 const a=inputs.a?signalFunction(inputs.a):c=>get('a',c),b=inputs.b?signalFunction(inputs.b):c=>get('b',c),source=signalFunction(inputs.value),time=inputs.time?signalFunction(inputs.time):c=>c.time||0;
 let fn;
 if(value.op==='lfo')fn=c=>{const phase=time(c)*get('frequency',c)+get('phase',c)/360,f=phase-Math.floor(phase),v=p.wave==='triangle'?1-4*Math.abs(f-.5):p.wave==='pulse'?Math.sin(f*Math.PI)**6:Math.sin(phase*Math.PI*2);return get('offset',c)+v*get('amplitude',c);};
 else if(value.op==='time')fn=c=>(c.time||0)*get('speed',c)+get('offset',c);
 else if(value.op==='noise')fn=c=>{
  const frequency=get('frequency',c),domain=p.domain;let x=0,y=0;
  if(domain==='spatial'){x=((c.position?.[0]??960)+get('x',c))/400*frequency;y=((c.position?.[1]??540)+get('y',c))/400*frequency;}
  if(domain==='path'){const angle=(c.u||0)*Math.PI*2;x=Math.cos(angle)*frequency;y=Math.sin(angle)*frequency+(c.index||0)*.73;}
  if(domain==='copy')x=(c.index||0)*frequency*.73;
  const z=time(c)*get('speed',c),seed=Math.round(get('seed',c)),octaves=Math.round(get('octaves',c));let sum=0,total=0,amplitude=1;
  for(let i=0;i<octaves;i++){sum+=noise3(x+17.31,y+8.71,z+3.19,seed+i*101)*amplitude;total+=amplitude;amplitude*=.5;x*=2;y*=2;}
  return mix(get('min',c),get('max',c),sum/total);
 };
 else if(value.op==='random')fn=c=>{const domain=p.domain,index=domain==='uniform'?0:(c.index||0),x=domain==='spatial'?Math.floor((c.position?.[0]||0)/40):index,y=domain==='path'?Math.floor((c.u||0)*1024):domain==='spatial'?Math.floor((c.position?.[1]||0)/40):0;return mix(get('min',c),get('max',c),hash(x,y,index,Math.round(get('seed',c))));};
 else if(value.op==='math')fn=c=>{const x=a(c),y=b(c);switch(p.operation){case 'add':return x+y;case 'subtract':return x-y;case 'multiply':return x*y;case 'divide':return Math.abs(y)<1e-8?0:x/y;case 'min':return Math.min(x,y);case 'max':return Math.max(x,y);case 'power':return Math.sign(x)*Math.abs(x)**clamp(y,-8,8);default:return x;}};
 else if(value.op==='remap')fn=c=>{const lo=get('inMin',c),hi=get('inMax',c),t=Math.abs(hi-lo)<1e-8?0:(source(c)-lo)/(hi-lo),u=p.clamp?clamp(t,0,1):t;return mix(get('outMin',c),get('outMax',c),p.smooth?smooth(clamp(u,0,1)):u);};
 else fn=()=>Number(value.value)||0;
 // A forked value graph may ask for the same upstream value more than once at
 // one sample. Memoise the coordinates, not context identity: consumers reuse
 // and mutate their context while walking points.
 let lastX,lastY,lastIndex,lastCount,lastU,lastTime,lastInstance,lastValue,hasLast=false;
 const safe=c=>{const x=c.position?.[0],y=c.position?.[1];if(hasLast&&x===lastX&&y===lastY&&c.index===lastIndex&&c.count===lastCount&&c.u===lastU&&c.time===lastTime&&c.instance===lastInstance)return lastValue;const v=fn(c);lastX=x;lastY=y;lastIndex=c.index;lastCount=c.count;lastU=c.u;lastTime=c.time;lastInstance=c.instance;hasLast=true;lastValue=Number.isFinite(v)?clamp(v,-1e9,1e9):0;return lastValue;};compiled.set(value,safe);return safe;
}
export function sampleSignal(value,context={}){return signalFunction(value)({...ROOT_CONTEXT,...context});}
export function signalDomain(value){return value?.type==='field'?'spatial':value?.domain||'uniform';}
export function signalUses(value,domain){return value?.contexts?.includes(domain)||signalDomain(value)===domain;}
export function shapeContext(shape,time=0,position,u=0){
 return {position:position||shape.origin||ROOT_CONTEXT.position,index:shape.copy||0,count:shape.count||1,instance:shape.instance||'',u,time};
}
export function pathCoordinates(shape){
 if(coordinates.has(shape))return coordinates.get(shape);const points=shape.points,result=[0];for(let i=1;i<points.length;i++)result.push(result.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));let length=result.at(-1)||0;if(shape.closed&&points.length>1)length+=Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1]);const normalised=result.map(v=>v/(length||1));coordinates.set(shape,normalised);return normalised;
}
