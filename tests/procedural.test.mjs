import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newNode,connect,validateConnection,evaluate,createEvaluator,cleanGraph,sharedNoiseStudy,createHistory} from '../src/model.js';
import {sampleSignal} from '../src/signals.js';
import {materialSample} from '../src/render.js';
const node=(g,id)=>g.nodes.find(n=>n.id===id);
function small(kinds){return {version:1,name:'Test',duration:6,nodes:kinds.map(k=>newNode(k,undefined,k)),edges:[],preview:kinds.at(-1)};}
function wire(g,source,target,targetHandle){return connect(g,{source,target,targetHandle});}
test('one shared Noise really drives geometry, glow and palette independently',()=>{
 const g=sharedNoiseStudy(),a=evaluate(g,g.preview,.4);assert.equal(a.error,null);
 const layer=a.value.layers[0],signal=a.cache.get('noise1'),context={position:[1010,620],time:.4,u:.3,index:0};
 assert.strictEqual(a.cache.get('remap1').inputs.value,signal);assert.strictEqual(layer.palette.mapping,signal);
 const sample=materialSample(layer,layer.shapes[0],.4,context.position,.3);
 assert.ok(Math.abs(sample.p.strength-(.05+.95*sampleSignal(signal,context)))<1e-10);
 assert.notDeepEqual(a.cache.get('displace1').shapes[0].points,a.cache.get('copy1').shapes[0].points);
 const other=materialSample(layer,layer.shapes[0],.4,[440,270],.1);assert.notEqual(other.color,sample.color);assert.notEqual(other.p.strength,sample.p.strength);
 const changed={...g,nodes:g.nodes.map(n=>n.id==='noise1'?{...n,data:{...n.data,params:{...n.data.params,seed:99}}}:n)},b=evaluate(changed,changed.preview,.4).value.layers[0];
 assert.notDeepEqual(b.shapes[0].points,layer.shapes[0].points);assert.notEqual(materialSample(b,b.shapes[0],.4,context.position,.3).color,sample.color);
});
test('copy pulls upstream primitive parameters in its own index context',()=>{
 let g=small(['random','circle','copy']);Object.assign(node(g,'random').data.params,{min:200,max:400,domain:'copy'});Object.assign(node(g,'copy').data.params,{count:5,scale:1,x:0,y:0});g=wire(wire(g,'random','circle','param:radius'),'circle','copy','shape');
 const r=evaluate(g);assert.equal(r.error,null);const radii=r.value.shapes.map(s=>s.points[0][0]-s.origin[0]);assert.ok(new Set(radii).size>=4);assert.ok(radii.every(x=>x>=200&&x<=400));
 assert.deepEqual(r.value,evaluate(cleanGraph(JSON.parse(JSON.stringify(g)))).value);
 node(g,'random').data.params.domain='uniform';const uniform=evaluate(g).value.shapes.map(s=>s.points[0][0]-s.origin[0]);assert.ok(uniform.every(x=>Math.abs(x-uniform[0])<1e-9));
});
test('nested copies provide distinct, deterministic context indices',()=>{
 let g=small(['random','circle','copy']);const outer=newNode('copy',undefined,'outer');g.nodes.push(outer);Object.assign(node(g,'copy').data.params,{count:3,scale:1,x:0,y:0});Object.assign(outer.data.params,{count:2,scale:1,x:0,y:0});Object.assign(node(g,'random').data.params,{min:200,max:400});g=wire(wire(wire(g,'random','circle','param:radius'),'circle','copy','shape'),'copy','outer','shape');g.preview='outer';
 const r=evaluate(g);assert.equal(r.error,null);const radii=r.value.shapes.map(s=>s.points[0][0]-s.origin[0]);assert.equal(new Set(radii).size,6);assert.equal(new Set(r.value.shapes.map(s=>s.instance)).size,6);assert.deepEqual(r.value,evaluate(g).value);
});
test('fields are scalar weights in Math and Remap but do not replace geometry',()=>{
 let g=small(['radial','noise','math','remap']);node(g,'noise').data.params.speed=0;g=wire(wire(wire(g,'noise','math','a'),'radial','math','b'),'math','remap','value');Object.assign(node(g,'remap').data.params,{outMin:10,outMax:70});
 const r=evaluate(g),f=r.cache.get('radial'),context={position:[f.x,f.y],time:0};assert.equal(r.error,null);assert.ok(sampleSignal(r.value,context)>10);assert.equal(sampleSignal(r.value,{position:[-10000,-10000]}),10);
 const shape=newNode('outline',undefined,'outline');g.nodes.push(shape);assert.match(validateConnection(g,{source:'noise',target:'outline',targetHandle:'shape'}),/cannot connect/);
});
test('time, spatial, path and copy sampling have deliberate distinct meanings',()=>{
 const g=small(['noise']),n=node(g,'noise'),c={position:[300,600],time:1,u:.2,index:2};n.data.params.speed=0;let v=evaluate(g).value;
 assert.equal(sampleSignal(v,c),sampleSignal(v,{...c,time:5,index:9,u:.9}));assert.notEqual(sampleSignal(v,c),sampleSignal(v,{...c,position:[900,600]}));
 n.data.params.domain='copy';v=evaluate(g).value;assert.equal(sampleSignal(v,c),sampleSignal(v,{...c,position:[900,600],u:.9}));assert.notEqual(sampleSignal(v,c),sampleSignal(v,{...c,index:3}));
 n.data.params.domain='path';v=evaluate(g).value;assert.notEqual(sampleSignal(v,c),sampleSignal(v,{...c,u:.7}));
 n.data.params.domain='uniform';n.data.params.speed=.2;v=evaluate(g).value;assert.equal(sampleSignal(v,c),sampleSignal(v,{...c,index:99,position:[20,20],u:.8}));assert.notEqual(sampleSignal(v,c),sampleSignal(v,{...c,time:2}));
});
test('animated generator parameters are themselves driven through the same system',()=>{
 let g=small(['lfo','noise']);Object.assign(node(g,'lfo').data.params,{offset:2,amplitude:1});g=wire(g,'lfo','noise','param:frequency');const engine=createEvaluator(),a=engine.evaluate(g,'noise',0),b=engine.evaluate(g,'noise',1);assert.equal(b.animated,true);assert.notEqual(sampleSignal(a.value,{time:0}),sampleSignal(b.value,{time:1}));
 assert.match(validateConnection(g,{source:'noise',target:'lfo',targetHandle:'param:amplitude'}),/cycle/);
});
test('shared drivers can be unplugged and undone without altering other consumers or the manual value',()=>{
 const g=sharedNoiseStudy(),h=createHistory(g),before=evaluate(g),edge=g.edges.find(e=>e.target==='optical1'&&e.targetHandle==='param:strength'),manual=node(g,'optical1').data.params.strength,next={...g,edges:g.edges.filter(e=>e.id!==edge.id)};h.record(next);
 const r=evaluate(next);assert.equal(r.error,null);assert.equal(r.value.layers[0].params.strength,manual);assert.equal(r.value.layers[0].bindings.strength,undefined);assert.deepEqual(r.value.layers[0].shapes,before.value.layers[0].shapes);assert.deepEqual(evaluate(h.undo()).value,before.value);
});
test('static procedural branches reuse cached work; animated branches reproduce any scrubbed frame',()=>{
 const g=sharedNoiseStudy();node(g,'noise1').data.params.speed=0;const engine=createEvaluator(),a=engine.evaluate(g,g.preview,0),b=engine.evaluate(g,g.preview,4);assert.equal(b.animated,false);assert.strictEqual(a.value,b.value);
 const moving={...g,nodes:g.nodes.map(n=>n.id==='noise1'?{...n,data:{...n.data,params:{...n.data.params,speed:.3}}}:n)};
 const first=engine.evaluate(moving,moving.preview,.6),later=engine.evaluate(moving,moving.preview,2),back=engine.evaluate(moving,moving.preview,.6);assert.equal(later.animated,true);assert.notDeepEqual(first.value.layers[0].shapes,later.value.layers[0].shapes);assert.deepEqual(first.value,back.value);assert.strictEqual(first.cache.get('copy1'),later.cache.get('copy1'));
});
test('the new graph round-trips with all scalar, spatial and colour connections intact',()=>{
 const g=sharedNoiseStudy(),reopened=cleanGraph(JSON.parse(JSON.stringify(g)));assert.equal(reopened.edges.length,11);assert.deepEqual(evaluate(reopened,reopened.preview,1).value,evaluate(g,g.preview,1).value);
 const edge=g.edges.find(e=>e.target==='displace1'&&e.targetHandle==='value');g.edges=g.edges.filter(e=>e.id!==edge.id);assert.deepEqual(evaluate(g,'displace1',0).value.shapes,evaluate(g,'copy1',0).value.shapes);
});
test('degenerate Math and Remap settings remain finite',()=>{
 const g=small(['math']);Object.assign(node(g,'math').data.params,{operation:'divide',a:1,b:0});assert.equal(evaluate(g).value.value,0);const remap=newNode('remap',undefined,'remap');g.nodes.push(remap);g.preview='remap';Object.assign(remap.data.params,{inMin:1,inMax:1});const next=wire(g,'math','remap','value');assert.ok(Number.isFinite(evaluate(next).value.value));
});
test('Resample adds detail to straight edges while retaining endpoints and attributes',()=>{
 let g=small(['rectangle','resample']);Object.assign(node(g,'rectangle').data.params,{width:500,height:200,corner:0});node(g,'resample').data.params.spacing=10;g=wire(g,'rectangle','resample','shape');const r=evaluate(g);assert.equal(r.error,null);const s=r.value.shapes[0];assert.equal(s.closed,true);assert.equal(s.fill,true);assert.equal(s.points.length,140);for(let i=0;i<s.points.length;i++){const a=s.points[i],b=s.points[(i+1)%s.points.length];assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<=10.01);}
});
test('spatial primitive drivers sample each copy position rather than a single global value',()=>{
 let g=small(['noise','circle','copy']);Object.assign(node(g,'noise').data.params,{min:150,max:300,speed:0});Object.assign(node(g,'copy').data.params,{count:4,x:200,y:0,scale:1});g=wire(wire(g,'noise','circle','param:radius'),'circle','copy','shape');const radii=evaluate(g).value.shapes.map(s=>s.points[0][0]-s.origin[0]);assert.ok(new Set(radii).size===4);
});
test('an explicit Time input can freeze or retime Noise without changing the composition clock',()=>{
 let g=small(['time','noise']);Object.assign(node(g,'time').data.params,{speed:0,offset:1.2});g=wire(g,'time','noise','time');const e=createEvaluator(),a=e.evaluate(g,'noise',0),b=e.evaluate(g,'noise',4);assert.equal(b.animated,false);assert.strictEqual(a.value,b.value);assert.equal(sampleSignal(a.value,{time:0}),sampleSignal(b.value,{time:4}));
 const changed={...g,nodes:g.nodes.map(n=>n.id==='time'?{...n,data:{...n.data,params:{...n.data.params,speed:.5}}}:n)};assert.equal(e.evaluate(changed,'noise',1).animated,true);assert.notEqual(sampleSignal(e.evaluate(changed,'noise',1).value,{time:1}),sampleSignal(e.evaluate(changed,'noise',3).value,{time:3}));
});
test('shared arithmetic branches reuse a value without losing sampling context',()=>{
 let g=small(['math']);node(g,'math').data.params.operation='add';node(g,'math').data.params.a=1;node(g,'math').data.params.b=0;let previous='math';for(let i=0;i<20;i++){const n=newNode('math',undefined,'m'+i);n.data.params.operation='add';g.nodes.push(n);g=wire(wire(g,previous,n.id,'a'),previous,n.id,'b');previous=n.id;}g.preview=previous;assert.equal(evaluate(g).value.value,2**20);
 const pattern=evaluate(small(['noise'])).value,context={position:[30,200],u:0,index:0,time:0},a=sampleSignal(pattern,context);context.position[0]=1300;const b=sampleSignal(pattern,context);assert.notEqual(a,b);context.position[0]=30;assert.equal(sampleSignal(pattern,context),a);
});
