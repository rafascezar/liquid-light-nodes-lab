import {RenderSession} from './gpu-renderer.js';
import {W,H,fieldAt,REGISTRY,clamp} from './model.js';
import {sampleSignal,signalFunction,shapeContext,signalDomain,signalUses,pathCoordinates} from './signals.js';
function path(ctx,s){ctx.beginPath();if(!s.points.length)return;ctx.moveTo(...s.points[0]);for(let i=1;i<s.points.length;i++)ctx.lineTo(...s.points[i]);if(s.closed)ctx.closePath();}
function lightGradient(ctx,colors,shift=0){
 const gradient=ctx.createLinearGradient(W*.06,H*.05,W*.94,H*.9);
 const palette=[colors[0],colors[1],colors[2],colors[1],colors[0],colors[1],colors[2],colors[1],colors[0]];
 for(let i=0;i<=24;i++){const t=i/24,u=((t+shift)%1+1)%1,k=u*(palette.length-1),j=Math.floor(k),a=palette[j],b=palette[Math.min(j+1,palette.length-1)],f=k-j;const rgb=[1,3,5].map(n=>Math.round(parseInt(a.slice(n,n+2),16)*(1-f)+parseInt(b.slice(n,n+2),16)*f));gradient.addColorStop(t,`rgb(${rgb.join(',')})`);}
 return gradient;
}
const glowSurfaces=new WeakMap();
function previewGlow(ctx,s,colors,shift,blur,width,alpha,paint){
 const m=ctx.getTransform(),scale=Math.max(.001,Math.abs(m.a)),q=scale*.25,padding=Math.ceil(blur*1.6+width*scale);
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const [x,y]of s.points){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 // Crop to the viewport, including the soft halo, before allocating a scratch surface.
 const pad=padding/scale;minX=Math.max(minX,-m.e/scale-pad);minY=Math.max(minY,-m.f/scale-pad);maxX=Math.min(maxX,(ctx.canvas.width-m.e)/scale+pad);maxY=Math.min(maxY,(ctx.canvas.height-m.f)/scale+pad);
 if(maxX<minX||maxY<minY)return;
 const x=minX-pad,y=minY-pad,w=Math.max(1,Math.ceil(((maxX-minX+2*pad)*q)/32)*32),h=Math.max(1,Math.ceil(((maxY-minY+2*pad)*q)/32)*32);
 let surface=glowSurfaces.get(ctx);if(!surface){surface=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');glowSurfaces.set(ctx,surface);}
 if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h;}
 const c=surface.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(q,0,0,q,-x*q,-y*q);c.lineCap='round';c.lineJoin='round';c.strokeStyle=lightGradient(c,colors,shift);c.lineWidth=width;c.globalAlpha=alpha;c.shadowBlur=blur*.25;c.shadowColor=colors[1];
 if(paint)paint(c);else{path(c,s);c.stroke();}c.shadowBlur=0;
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=1;ctx.drawImage(surface,x,y,w/q,h/q);ctx.restore();
}
export function paletteColor(colors,value){
 const t=clamp(value,0,1)*(colors.length-1),i=Math.min(colors.length-2,Math.floor(t)),f=t-i,a=colors[i],b=colors[i+1];
 return '#'+[1,3,5].map(k=>Math.round(parseInt(a.slice(k,k+2),16)*(1-f)+parseInt(b.slice(k,k+2),16)*f).toString(16).padStart(2,'0')).join('');
}
function layerParameters(layer,context){return Object.fromEntries(Object.entries(layer.params).map(([k,v])=>[k,layer.bindings?.[k]&&REGISTRY.optical.params[k].sample==='point'?clamp(sampleSignal(layer.bindings[k],context),REGISTRY.optical.params[k].min,REGISTRY.optical.params[k].max):v]));}
export function materialSample(layer,shape,time,position,u){
 const context=shapeContext(shape,time,position,u),p=layerParameters(layer,context),mapping=layer.palette.mapping;
 const offset=layer.palette.offsetSource?sampleSignal(layer.palette.offsetSource,context):layer.palette.offset;
 return {p,color:mapping?paletteColor(layer.palette.colors,clamp(sampleSignal(mapping,context)+offset+time*p.speed,0,1)):null,width:shape.widthSource?clamp(sampleSignal(shape.widthSource,context),1,240)*(shape.widthScale||1):shape.width,context};
}
function variableWidth(shape,time){
 if(!shape.widthSource)return shape;const sample=signalFunction(shape.widthSource),context=shapeContext(shape,time),u=signalUses(shape.widthSource,'path')?pathCoordinates(shape):null;
 return {...shape,widthValues:shape.points.map((position,i)=>{context.position=position;context.u=u?u[i]:0;return clamp(sample(context),1,240)*(shape.widthScale||1);})};
}
function paintGeometry(ctx,s,style,factor=1,pad=0){
 ctx.fillStyle=style;ctx.strokeStyle=style;
 if(s.fill){path(ctx,s);ctx.fill();return;}
 if(!s.widthValues){path(ctx,s);ctx.lineWidth=Math.max(1,(s.width||1)*factor+pad);ctx.stroke();return;}
 const sides=[[],[]],points=s.points,count=points.length;
 for(let i=0;i<count;i++){const before=points[s.closed?(i+count-1)%count:Math.max(0,i-1)],after=points[s.closed?(i+1)%count:Math.min(count-1,i+1)],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1,w=(s.widthValues[i]*factor+pad)/2;sides[0].push([points[i][0]+dy/length*w,points[i][1]-dx/length*w]);sides[1].push([points[i][0]-dy/length*w,points[i][1]+dx/length*w]);}
 ctx.beginPath();if(s.closed){for(const side of [sides[0],sides[1].reverse()]){ctx.moveTo(...side[0]);for(let i=1;i<side.length;i++)ctx.lineTo(...side[i]);ctx.closePath();}}else{const side=[...sides[0],...sides[1].reverse()];ctx.moveTo(...side[0]);for(let i=1;i<side.length;i++)ctx.lineTo(...side[i]);ctx.closePath();}ctx.fill('evenodd');
}
const materialSurfaces=new WeakMap();
function colorPattern(ctx,surface){const p=ctx.createPattern(surface,'no-repeat');p.setTransform({a:W/surface.width,b:0,c:0,d:H/surface.height,e:0,f:0});return p;}
function needsPath(layer){return [layer.palette.mapping,layer.palette.offsetSource,...Object.values(layer.bindings||{})].some(v=>signalUses(v,'path'));}
function materialTexture(ctx,layer,shape,time,preview){
 const hasPath=needsPath(layer),w=hasPath?(preview?48:256):(preview?64:384),h=Math.round(w*H/W),p=layer.params,colors=layer.palette.colors;
 let surfaces=materialSurfaces.get(ctx);if(!surfaces){surfaces={};materialSurfaces.set(ctx,surfaces);}
 const make=key=>{let canvas=surfaces[key];if(!canvas){canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');surfaces[key]=canvas;}if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const c=canvas.getContext('2d');return {surface:canvas,context:c,data:c.createImageData(w,h)};};
 const output={body:make('body'),rim:make('rim'),glows:(layer.bindings?.glow?[0,60,120]:[p.glow]).map((radius,i)=>({...make('glow'+i),radius}))};
 const mapping=layer.palette.mapping?signalFunction(layer.palette.mapping):null,offset=layer.palette.offsetSource?signalFunction(layer.palette.offsetSource):()=>layer.palette.offset,fs=Object.fromEntries(Object.entries(layer.bindings||{}).map(([k,v])=>[k,signalFunction(v)])),get=(key,c)=>fs[key]&&REGISTRY.optical.params[key].sample==='point'?clamp(fs[key](c),REGISTRY.optical.params[key].min,REGISTRY.optical.params[key].max):p[key];
 const context=shapeContext(shape,time),u=hasPath?pathCoordinates(shape):null,sequence=[colors[0],colors[1],colors[2],colors[1],colors[0],colors[1],colors[2],colors[1],colors[0]],stops=(mapping?colors:sequence).map(hex=>[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16))),vx=W*.88,vy=H*.85,den=vx*vx+vy*vy;
 context.position=[0,0];
 const write=(target,k,r,g,b,alpha)=>{const data=target.data.data;data[k]=r;data[k+1]=g;data[k+2]=b;data[k+3]=clamp(alpha,0,1)*255;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  context.position[0]=(x+.5)/w*W;context.position[1]=(y+.5)/h*H;
  if(hasPath){let nearest=Infinity;for(let i=0;i<shape.points.length;i++){const pt=shape.points[i],dx=pt[0]-context.position[0],dy=pt[1]-context.position[1],d=dx*dx+dy*dy;if(d<nearest){nearest=d;context.u=u[i];}}}
  const shift=offset(context)+time*p.speed,t=mapping?clamp(mapping(context)+shift,0,1):((clamp(((context.position[0]-W*.06)*vx+(context.position[1]-H*.05)*vy)/den,0,1)+shift)%1+1)%1,v=t*(stops.length-1),j=Math.min(stops.length-2,Math.floor(v)),f=v-j,a=stops[j],b=stops[j+1],r=a[0]+(b[0]-a[0])*f,g=a[1]+(b[1]-a[1])*f,blue=a[2]+(b[2]-a[2])*f,k=(y*w+x)*4,body=get('body',context),rim=get('rim',context),strength=get('strength',context),glow=get('glow',context);
  write(output.body,k,r,g,blue,body);write(output.rim,k,r,g,blue,rim);
  for(const item of output.glows)write(item,k,r,g,blue,strength*(output.glows.length===1?1:Math.max(0,1-Math.abs(glow-item.radius)/60)));
 }
 for(const t of [output.body,output.rim,...output.glows])t.context.putImageData(t.data,0,0);
 return output;
}
function proceduralSurface(ctx,layer,s,time,preview,textures){
 const shape=variableWidth(s,time),opacity=s.opacity*layer.opacity,width=shape.widthValues?Math.max(...shape.widthValues):shape.width||1;
 for(const glow of textures.glows){if(glow.radius<=0)continue;const radius=glow.radius*1.5;if(preview)previewGlow(ctx,shape,layer.palette.colors,0,radius,width*1.15,opacity*.65,c=>paintGeometry(c,shape,colorPattern(c,glow.surface),1.15));else{ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowBlur=radius;ctx.shadowColor=layer.palette.colors[1];ctx.globalAlpha=opacity*.65;paintGeometry(ctx,shape,colorPattern(ctx,glow.surface),1.15);ctx.restore();}}
 ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
 if(shape.fill){ctx.globalAlpha=opacity*.55;paintGeometry(ctx,shape,colorPattern(ctx,textures.body.surface));return;}
 ctx.globalAlpha=opacity;paintGeometry(ctx,shape,'#02082b',1,3);
 ctx.globalAlpha=opacity;paintGeometry(ctx,shape,colorPattern(ctx,textures.body.surface));
 ctx.globalAlpha=opacity*.34;paintGeometry(ctx,shape,layer.palette.colors[2],.9);
 ctx.globalAlpha=opacity;paintGeometry(ctx,shape,colorPattern(ctx,textures.body.surface),.77);
 ctx.globalAlpha=opacity*.58;paintGeometry(ctx,shape,layer.palette.colors[0],.54);
 ctx.globalCompositeOperation='screen';ctx.globalAlpha=opacity*.8;paintGeometry(ctx,shape,colorPattern(ctx,textures.rim.surface),.065);ctx.globalCompositeOperation='source-over';
}
function paintShapes(ctx,shapes,time){const groups=new Map();for(const original of shapes){const shape=variableWidth(original,time);if(shape.points.length<2)continue;if(!shape.fill){ctx.globalAlpha=shape.opacity;paintGeometry(ctx,shape,'#edf2fc');continue;}const key=(shape.objectInstance||shape.instance||'source')+':'+shape.opacity+':'+shape.fillRule;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(shape);}for(const group of groups.values()){ctx.globalAlpha=group[0].opacity;ctx.fillStyle='#edf2fc';ctx.beginPath();for(const s of group){ctx.moveTo(...s.points[0]);for(const p of s.points.slice(1))ctx.lineTo(...p);if(s.closed)ctx.closePath();}ctx.fill(group.some(s=>s.fillRule==='evenodd')?'evenodd':'nonzero');}}
const renderSessions=new WeakMap(),versions=new WeakMap(),bitmapImages=new Map();let imageVersion=0;
export function imageAsset(src){if(!src)return null;let item=bitmapImages.get(src);if(!item){const image=new Image();item={image,ready:false,error:null};item.promise=new Promise(resolve=>{image.onload=()=>{item.ready=true;imageVersion++;resolve();};image.onerror=()=>{item.error='Could not decode this image.';imageVersion++;resolve();};});image.src=src;bitmapImages.set(src,item);if(bitmapImages.size>40)bitmapImages.delete(bitmapImages.keys().next().value);}return item;}
export async function prepareAssets(value){const assets=[];const walk=v=>{for(const layer of v?.layers||[]){if(layer.kind==='bitmap'){const image=imageAsset(layer.image);if(image)assets.push(image.promise);}walk(layer.backgroundImage);}};walk(value);await Promise.all(assets);}
export function sessionFor(ctx){let session=renderSessions.get(ctx);if(!session){session=new RenderSession();renderSessions.set(ctx,session);}return session;}
export function renderingPending(ctx){return !!renderSessions.get(ctx)?.needsWork()||versions.get(ctx)!==imageVersion;}
export function renderingStatus(ctx){return renderSessions.get(ctx)?.status();}
export function disposeRenderer(ctx){renderSessions.get(ctx)?.dispose();renderSessions.delete(ctx);}
function backgroundSurface(ctx,preview=false){const m=ctx.getTransform(),canvas=document.createElement('canvas');canvas.width=Math.max(32,Math.min(preview?480:1920,Math.round(W*Math.abs(m.a))));canvas.height=Math.round(canvas.width*H/W);canvas.getContext('2d').drawImage(ctx.canvas,m.e,m.f,W*m.a,H*m.d,0,0,canvas.width,canvas.height);return canvas;}
export function renderArt(ctx,value,time=0,{transparent=false,preview=false,offline=false,session,warmup=false,nested=false}={}){
 versions.set(ctx,imageVersion);if(!nested){const ids=new Set(),walk=value=>{for(const l of value?.layers||[]){ids.add(l.id);walk(l.backgroundImage);}};walk(value);(session||renderSessions.get(ctx))?.prune(ids);}
 ctx.save();try{ctx.lineCap='round';ctx.lineJoin='round';
 if(value.type==='shape'){
  paintShapes(ctx,value.shapes,time);
 }else if(value.type==='image'){
  if(!transparent){ctx.fillStyle=value.background||'#070b22';ctx.fillRect(0,0,W,H);}
  for(const layer of value.layers){
   if(layer.backgroundImage)renderArt(ctx,layer.backgroundImage,time,{transparent:true,preview,offline,session,warmup,nested:true});
   if(layer.kind==='bitmap'){const item=imageAsset(layer.image);if(item?.ready){const p=layer.params,h=p.width/(layer.aspect||1);ctx.save();ctx.globalAlpha=(p.opacity??1)*(layer.opacity??1);ctx.drawImage(item.image,p.x-p.width/2,p.y-h/2,p.width,h);ctx.restore();}continue;}
   if(layer.shapes?.some(s=>s.fillRule==='evenodd')||layer.kind==='fluid'||layer.material||(layer.effects||[]).length||layer.params.renderer==='gpu'){(session||sessionFor(ctx)).draw(ctx,layer,time,{preview,offline,backgroundCanvas:warmup?null:backgroundSurface(ctx,preview),maxSteps:warmup?6:undefined,skipRender:warmup});continue;}
   const p=layer.params,gradient=lightGradient(ctx,layer.palette.colors,layer.palette.offset+time*p.speed),perInstance=needsPath(layer)||[layer.palette.mapping,layer.palette.offsetSource,...Object.values(layer.bindings||{})].some(v=>signalUses(v,'copy'));let textures;
   for(const original of [...layer.shapes].reverse()){
    if(original.points.length<2)continue;
    const s=layer.field&&(p.stretch>0||layer.bindings?.stretch)?{...original,points:original.points.map((pt,i)=>{const f=fieldAt(layer.field,pt),stretch=layer.bindings?.stretch?layerParameters(layer,shapeContext(original,time,pt,i/Math.max(1,original.points.length-1))).stretch:p.stretch,a=stretch*f.weight*f.core;return [pt[0]+f.normal[0]*a,pt[1]+f.normal[1]*a];})}:original;
    if(Object.keys(layer.bindings||{}).some(k=>k!=='speed')||layer.palette.mapping||s.widthSource){if(!textures||perInstance)textures=materialTexture(ctx,layer,s,time,preview);proceduralSurface(ctx,layer,s,time,preview,textures);continue;}
    const opacity=s.opacity*layer.opacity,w=Math.max(s.width||1,1);path(ctx,s);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=opacity*p.body;ctx.strokeStyle=gradient;ctx.fillStyle=gradient;
    if(s.fill){ctx.globalAlpha=opacity*p.body*.55;ctx.fill();continue;}
    if(p.glow>0&&p.strength>0){if(preview)previewGlow(ctx,s,layer.palette.colors,layer.palette.offset+time*p.speed,p.glow*1.5,w*1.15,opacity*p.strength*.65);else{ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowBlur=p.glow*1.5;ctx.shadowColor=layer.palette.colors[1];ctx.globalAlpha=opacity*p.strength*.65;ctx.lineWidth=w*1.15;ctx.stroke();ctx.restore();}}
    ctx.shadowBlur=0;ctx.globalAlpha=opacity;ctx.strokeStyle='#02082b';ctx.lineWidth=w+3;ctx.stroke();
    ctx.globalAlpha=opacity*p.body;ctx.strokeStyle=gradient;ctx.lineWidth=w;ctx.stroke();
    ctx.globalAlpha=opacity*.34;ctx.strokeStyle=layer.palette.colors[2];ctx.lineWidth=w*.9;ctx.stroke();
    ctx.globalAlpha=opacity*p.body;ctx.strokeStyle=gradient;ctx.lineWidth=w*.77;ctx.stroke();
    ctx.globalAlpha=opacity*.58;ctx.strokeStyle=layer.palette.colors[0];ctx.lineWidth=w*.54;ctx.stroke();
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=opacity*p.rim*.8;ctx.strokeStyle=gradient;ctx.lineWidth=Math.max(1.4,w*.065);ctx.shadowBlur=preview?0:p.glow*.16;ctx.shadowColor=layer.palette.colors[2];ctx.stroke();ctx.shadowBlur=0;
    ctx.globalCompositeOperation='source-over';
   }
  }
 }else if(value.type==='field'){
  const temp=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(160,90):document.createElement('canvas');temp.width=160;temp.height=90;const c=temp.getContext('2d'),img=c.createImageData(160,90);
  for(let y=0;y<90;y++)for(let x=0;x<160;x++){const a=Math.round(fieldAt(value,[x/160*W,y/90*H]).weight*255),k=(y*160+x)*4;img.data[k]=a*.78;img.data[k+1]=a*.94;img.data[k+2]=a;img.data[k+3]=255;}c.putImageData(img,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(temp,0,0,W,H);
 }else if(value.type==='palette'){
  ctx.fillStyle=lightGradient(ctx,value.colors,value.offset);ctx.fillRect(0,0,W,H);
 }else if(value.type==='signal'){
  const domain=signalDomain(value);
  if(domain==='spatial'){
   const temp=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(160,90):document.createElement('canvas');temp.width=160;temp.height=90;const c=temp.getContext('2d'),img=c.createImageData(160,90),sample=signalFunction(value);
   for(let y=0;y<90;y++)for(let x=0;x<160;x++){const a=clamp(sample({position:[x/160*W,y/90*H],time,index:0,u:x/160}),0,1)*255,k=(y*160+x)*4;img.data[k]=a;img.data[k+1]=a;img.data[k+2]=a;img.data[k+3]=255;}c.putImageData(img,0,0);ctx.drawImage(temp,0,0,W,H);
  }else{
   const values=Array.from({length:240},(_,i)=>sampleSignal(value,{time:domain==='uniform'?i/239*6:time,u:i/239,index:Math.floor(i/239*12),count:12})),lo=Math.min(...values),hi=Math.max(...values),range=Math.max(1e-6,hi-lo);
   ctx.strokeStyle='#e7bc62';ctx.lineWidth=4;ctx.beginPath();values.forEach((v,i)=>{const x=i/239*W,y=H*.8-(hi===lo?.5:(v-lo)/range)*H*.6;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
  }
 }
 }finally{ctx.restore();}
}
export function frameCanvas(value,time=0,width=960,transparent=false){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width*H/W);const ctx=canvas.getContext('2d'),session=new RenderSession();ctx.scale(width/W,width/W);try{renderArt(ctx,value,time,{transparent,offline:true,session});}finally{session.dispose();}return canvas;}
