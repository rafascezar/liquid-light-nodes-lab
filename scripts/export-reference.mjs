// Generate a portable description of the current registry and canonical examples.
// No user data, cloud access or renderer resources are read.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {REGISTRY,CATEGORIES,nodeDefinition,newNode,cleanGraph,starter,sharedNoiseStudy} from '../src/model.js';
import {featureStudy} from '../src/examples.js';

await mkdir('docs/reference',{recursive:true});
await mkdir('examples',{recursive:true});
const order=kind=>CATEGORIES.indexOf(REGISTRY[kind].category);
const kinds=Object.keys(REGISTRY).sort((a,b)=>order(a)-order(b)||a.localeCompare(b));
const nodes=kinds.map(kind=>{
  const def=nodeDefinition(newNode(kind));
  // Legacy constructors migrate to Shapes; retain original registry schemas too.
  const schema=REGISTRY[kind].hidden&&kind!=='inlet'?REGISTRY[kind]:def;
  return {kind,name:REGISTRY[kind].name,category:REGISTRY[kind].category,hidden:!!REGISTRY[kind].hidden,
    description:REGISTRY[kind].description||'',output:schema.out,inputs:schema.inputs||[],bypass:schema.bypass||null,params:schema.params||{}};
});
await writeFile('docs/reference/nodes.json',JSON.stringify({format:'liquid-light-node-reference',version:1,documentVersion:1,logicalCanvas:{width:1920,height:1080},notes:['Generated from current registry/nodeDefinition; dynamic group interfaces depend on saved group data.','Legacy circle/rectangle/triangle kinds migrate to Shapes. Inlet is internal.','Numeric parameters expose param:<key> sockets; sample describes consumer sampling.'],nodes},null,2)+'\n');
const cell=v=>String(v??'—').replaceAll('|','\\|').replaceAll('\n',' ');
const value=v=>typeof v==='string'?v:JSON.stringify(v);
let md='# Generated node and parameter reference\n\nRegenerate with `node scripts/export-reference.mjs` from the repository root. Source: REGISTRY plus nodeDefinition, including generic whole-output transforms. Group interfaces are dynamic; the built-in empty group shown here is only a default. Hidden legacy primitive kinds migrate on construction/import and are retained here for format archaeology. See [graph semantics](../handoff/03-graph-and-procedural-engine.md).\n\n';
md+='| Kind | Label | Category | Output | Visibility |\n| --- | --- | --- | --- | --- |\n';
for(const n of nodes)md+=`| ${n.kind} | ${cell(n.name)} | ${cell(n.category)} | ${n.output} | ${n.hidden?'Internal/legacy':'Library'} |\n`;
for(const n of nodes){
  md+=`\n## ${n.name} (${n.kind})\n\n${n.description}\n\nOutput: **${n.output}**. ${n.bypass?'Bypass passes through `'+n.bypass+'`.':'No passthrough bypass.'}\n\n`;
  if(n.inputs.length){md+='| Input ID | Type | Required |\n| --- | --- | --- |\n';for(const i of n.inputs)md+=`| ${i.id} | ${i.type} | ${i.required?'Yes':'No'} |\n`;}
  else md+='No fixed inputs.\n';
  if(!Object.keys(n.params).length){md+='\nNo fixed parameters.\n';continue;}
  md+='\n| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n';
  for(const [key,p]of Object.entries(n.params)){
    const range=p.options?.join(', ')??(p.type==='number'?`${p.min}…${p.max}; step ${p.step}`:'—');
    const conditions=[p.when?'Shape: '+p.when.join(', '):'',p.showIf?'Show if '+p.showIf:'',p.hideIf?'Hide if '+p.hideIf:'',p.advanced?'Advanced':'',p.section?'Section: '+p.section:''].filter(Boolean).join('; ')||'Always';
    md+='| '+[key,p.label,p.type,value(p.value),range,p.unit||'—',p.sample||'—',conditions].map(cell).join(' | ')+' |\n';
  }
}
await writeFile('docs/reference/nodes.md',md);
const examples=[['starter',starter()],['shared-noise',sharedNoiseStudy()],...['shapes','glass','fluid','effects'].map(key=>[key,featureStudy(key)])];
let index='# Native example graphs\n\nImport a `.llnodes.json` through the editor. These are built-in examples, not personal saved studies. Regenerate with `node scripts/export-reference.mjs`.\n\n| File | Study | Nodes | Edges |\n| --- | --- | --- | --- |\n';
for(const [key,raw]of examples){const graph=cleanGraph({...raw,edges:raw.edges.map((e,i)=>({...e,id:`example-edge-${i+1}`}))});await writeFile(`examples/${key}.llnodes.json`,JSON.stringify(graph,null,2)+'\n');index+=`| [${key}.llnodes.json](${key}.llnodes.json) | ${graph.name} | ${graph.nodes.length} | ${graph.edges.length} |\n`;}
await writeFile('examples/README.md',index);
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const dependencies=Object.entries(lock.packages).filter(([path])=>path).map(([path,p])=>({path,name:p.name||path.split('node_modules/').at(-1),version:p.version,license:p.license||'Not declared',dev:!!p.dev,optional:!!p.optional})).sort((a,b)=>a.path.localeCompare(b.path));
await writeFile('docs/reference/dependencies.json',JSON.stringify({format:'liquid-light-locked-dependencies',lockfileVersion:lock.lockfileVersion,dependencies},null,2)+'\n');
let notices='# Third-party notices\n\nGenerated from licence/notice files present in installed packages. The lockfile inventory also lists optional packages not installed on this platform. These notices do not license the project itself or user-imported art. Preserve relevant upstream notices when distributing bundled code.\n';
let found=0;
for(const p of dependencies){let files;try{files=await readdir(p.path);}catch{continue;}const licenses=files.filter(name=>/^(licen[sc]e|notice|copyright)(\.|$)/i.test(name)).sort();for(const name of licenses){let body;try{body=await readFile(`${p.path}/${name}`,'utf8');}catch{continue;}if(body.length>1_000_000)throw new Error('Unexpectedly large licence file');notices+=`\n## ${p.name} ${p.version} — ${name}\n\nDeclared licence: ${p.license}.\n\n\`\`\`text\n${body.trim()}\n\`\`\`\n`;found++;}}
await writeFile('THIRD_PARTY_NOTICES.md',notices);
console.log(JSON.stringify({nodes:nodes.length,visible:nodes.filter(n=>!n.hidden).length,examples:examples.length,lockedPackages:dependencies.length,licenseFiles:found}));
