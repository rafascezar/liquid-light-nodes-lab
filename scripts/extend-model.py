from pathlib import Path
p=Path('src/model.js');s=p.read_text()
s="import {EXTENSIONS,DEFAULT_PATH,cleanPaths,samplePaths} from './extended.js';\n"+s
s=s.replace("image:'#389aff'", "image:'#389aff',material:'#8ed3bb',effects:'#f2ae79'")
s=s.replace("export const CATEGORIES=['Sources'", "Object.assign(REGISTRY,EXTENSIONS);\nREGISTRY.optical.inputs.push(input('material','material',false),input('effects','effects',false),input('background','image',false));\nREGISTRY.optical.params.renderer=select('Renderer','canvas',['canvas','gpu']);\nREGISTRY.optical.description='Render editable paths as light, with optional material, background and procedural effect inputs.';\nexport const CATEGORIES=['Sources'")
s=s.replace("'Colour','Motion','Light','Output'];", "'Colour','Motion','Materials','Effects','Light','Assets','Output'];")
# Dynamic interfaces retain typed ports for user-created groups.
a=s.index('export function newNode(')
s=s[:a]+'''export function nodeDefinition(node){const data=node?.data||node;if(!data)return {};const base=REGISTRY[data.kind]||{};if(data.kind==='inlet')return {...base,out:data.outputType||'shape'};if(data.kind!=='group')return base;return {...base,out:data.outputType||'shape',inputs:data.inputs||[],params:Object.fromEntries((data.exposed||[]).map(e=>[e.key,{...e.schema,label:e.label||e.schema.label}]))};}
'''+s[a:]
s=s.replace(" return {id:id||kind+", " const result={id:id||kind+")
s=s.replace(".map(([k,p])=>[k,p.value]))}};\n}", ".map(([k,p])=>[k,p.value]))}};\n if(kind==='path'||kind==='svg')result.data.paths=structuredClone(DEFAULT_PATH);\n if(kind==='group'){const source=newNode('circle',{x:0,y:0},'source');result.data.graph={version:1,name:'Group',nodes:[source],edges:[],preview:'source',duration:6};result.data.outputId='source';result.data.outputType='shape';result.data.inputs=[];result.data.exposed=[];}\n return result;\n}")
s=s.replace("REGISTRY[node.data.kind]?.params", "nodeDefinition(node)?.params").replace("REGISTRY[node.data.kind]?.inputs", "nodeDefinition(node)?.inputs")
s=s.replace("out=REGISTRY[from.data.kind].out", "out=nodeDefinition(from).out")
s=s.replace("REGISTRY[node.data.kind].inputs", "nodeDefinition(node).inputs").replace("REGISTRY[node.data.kind].out", "nodeDefinition(node).out")
s=s.replace("export function cleanGraph(raw){", "export function cleanGraph(raw,depth=0){\n if(depth>6)throw new Error('Groups may be nested up to six levels.');")
s=s.replace("out.data.bypassed=!!n.data.bypassed&&!!REGISTRY[n.data.kind].bypass;", "out.data.bypassed=!!n.data.bypassed&&!!nodeDefinition(n).bypass;\n  if(['path','svg'].includes(n.data.kind))out.data.paths=cleanPaths(n.data.paths||DEFAULT_PATH);\n  if(n.data.kind==='bitmap'){if(typeof n.data.image!=='string'||n.data.image.length>5500000||!/^data:image\\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(n.data.image))throw new Error('Invalid embedded image.');out.data.image=n.data.image;out.data.aspect=clamp(Number(n.data.aspect)||1,.05,20);}\n  if(n.data.kind==='inlet'){out.data.inputId=String(n.data.inputId||'input').slice(0,100);out.data.outputType=Object.keys(TYPES).includes(n.data.outputType)?n.data.outputType:'shape';}\n  if(n.data.kind==='group'){out.data.graph=cleanGraph(n.data.graph,depth+1);out.data.outputId=n.data.outputId||out.data.graph.preview;const source=out.data.graph.nodes.find(v=>v.id===out.data.outputId);if(!source)throw new Error('The group needs an output node.');out.data.outputType=nodeDefinition(source).out;out.data.inputs=(n.data.inputs||[]).slice(0,32).map(v=>{if(typeof v.id!=='string'||!Object.keys(TYPES).includes(v.type))throw new Error('Invalid group input.');return {id:v.id.slice(0,100),type:v.type,required:!!v.required,label:String(v.label||v.id).slice(0,60)};});out.data.exposed=(n.data.exposed||[]).slice(0,32).map(e=>{const target=out.data.graph.nodes.find(v=>v.id===e.nodeId),schema=target&&nodeDefinition(target).params?.[e.param];if(!schema||schema.type!=='number')throw new Error('Invalid exposed parameter.');return {key:String(e.key).slice(0,50),nodeId:e.nodeId,param:e.param,label:String(e.label||schema.label).slice(0,60),schema:{...schema}};});}")
s=s.replace("Object.entries(REGISTRY[n.data.kind].params)", "Object.entries(nodeDefinition(out).params)")
s=s.replace(" let graph={version:1", " let graph={version:1")
# Preserve options for external group inputs and root simulation timelines.
s=s.replace("const entries=new Map();let previousNodes,previousEdges,map,inputs,contextual;", "const entries=new Map(),groupEngines=new Map();let previousNodes,previousEdges,map,inputs,contextual;")
s=s.replace("evaluate(graph,target=graph.preview,time=0){", "evaluate(graph,target=graph.preview,time=0,options={}){")
s=s.replace("REGISTRY[node?.data.kind]", "nodeDefinition(node)").replace("REGISTRY[map.get(e.source)?.data.kind]?.out", "nodeDefinition(map.get(e.source))?.out")
s=s.replace("['radial','linear'].includes(kind)", "['radial','linear','box','shapeField'].includes(kind)")
s=s.replace("{entries,map,inputs,contextual});", "{entries,map,inputs,contextual,groupEngines,options});")
s=s.replace("function evaluateGraph(graph,target,time,{entries,map,inputs,contextual}){", "function evaluateGraph(graph,target,time,{entries,map,inputs,contextual,groupEngines,options}){")
s=s.replace("root={...ROOT_CONTEXT,time};", "root={...ROOT_CONTEXT,...options.context,time},namespace=options.namespace||'',rootGraph=options.rootGraph||graph,rootTarget=options.rootTarget||target,external=options.external||{};")
s=s.replace("const d=REGISTRY[node.data.kind],params=", "const d=nodeDefinition(node),params=")
s=s.replace("const dependencyValues=[...d.inputs", "const dependencyValues=[...(node.data.kind==='inlet'?[external[node.data.inputId]]:[]),...d.inputs")
s=s.replace("(kind==='deform'&&p.speed!==0&&p.amount!==0);", "(kind==='deform'&&p.speed!==0&&p.amount!==0)||kind==='fluid'||(kind==='contourPulse'&&p.frequency!==0)||(kind==='venetian'&&(p.speed!==0||p.timeDisplacement!==0));")
# New value types and geometry streams.
a=s.index("  if(['circle','rectangle','triangle'].includes(kind))")
s=s[:a]+'''  if(kind==='inlet'){out=external[node.data.inputId];if(!out)throw new Error(`${node.data.label}: connect its group input.`);}
  else if(kind==='group'){
   let engine=groupEngines.get(node.data);if(!engine){engine=createEvaluator();groupEngines.set(node.data,engine);if(groupEngines.size>80)groupEngines.delete(groupEngines.keys().next().value);}
   const values=Object.fromEntries(d.inputs.map(port=>[port.id,read(port.id,port.required)]));for(const exposed of node.data.exposed||[])values['param:'+exposed.key]=bindings[exposed.key]||{type:'signal',value:p[exposed.key],domain:'uniform'};
   const result=engine.evaluate(node.data.graph,node.data.outputId,time,{context,external:values,rootGraph,rootTarget,namespace:namespace+id+'/'});if(result.error)throw new Error(node.data.label+': '+result.error);out=result.value;animated.set(id,result.animated||isAnimated);
  }else if(kind==='path'||kind==='svg')out={type:'shape',shapes:transformShapes(samplePaths(node.data.paths||DEFAULT_PATH),p)};
  else if(kind==='bitmap')out={type:'image',background:'#070b22',layers:[{kind:'bitmap',id:namespace+id,image:node.data.image,aspect:node.data.aspect||1,params:p,bindings,opacity:1}]};
  else if(kind==='glass')out={type:'material',params:p,bindings,mask:read('mask')};
  else if(d.out==='effects')out={type:'effects',items:[...(read('effects')?.items||[]),{kind,id:namespace+id,params:p,bindings,mask:read('mask'),time:read('time')}]};
  else if(kind==='box')out={type:'field',kind,x:W*p.x/100,y:H*p.y/100,rx:H*p.width/200,ry:H*p.height/200,angle:p.angle,falloff:p.falloff,core:0,strength:p.strength,invert:p.invert};
  else if(kind==='shapeField'){const source=read('shape',true),centre=bounds(source.shapes);out={type:'field',kind,shapes:source.shapes,x:centre[0],y:centre[1],rx:p.reach,ry:p.reach,reach:p.reach,mode:p.mode,strength:p.strength,invert:p.invert,falloff:1,core:0};}
  else if(['circle','rectangle','triangle'].includes(kind))''' +s[a+len("  if(['circle','rectangle','triangle'].includes(kind))"):]
s=s.replace("}else if(kind==='optical'){", "}else if(kind==='optical'||kind==='fluid'){")
s=s.replace("out={type:'image',background:p.background,layers:[{shapes:shape.shapes,palette,field,params:p,bindings,opacity:1}]};", "out={type:'image',background:p.background,layers:[{id:namespace+id,kind,shapes:shape.shapes,palette,field,material:kind==='optical'?read('material'):null,effects:read('effects')?.items||[],backgroundImage:read('background'),params:p,bindings,opacity:1,timeline:{graph:rootGraph,target:rootTarget,id:namespace+id}}]};")
# Only read new ports on actual definitions (fluid has no material).
p.write_text(s)
