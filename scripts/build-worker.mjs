import {build} from 'vite';
import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
await rm('dist',{recursive:true,force:true});await build({build:{outDir:'dist/client'}});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'},assets={};
async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const key=prefix+'/'+entry.name,path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path,key);else assets[key]={type:types[extname(path)]||'application/octet-stream',data:(await readFile(path)).toString('base64')};}}
await walk('dist/client');await mkdir('.build',{recursive:true});await writeFile('.build/entry.js',`import {worker} from '../server/worker.js';export default worker(${JSON.stringify(assets)});`);
await build({configFile:false,build:{ssr:'.build/entry.js',outDir:'dist/server',emptyOutDir:true,minify:true,rollupOptions:{output:{entryFileNames:'index.js'}}}});await rm('.build',{recursive:true,force:true});
