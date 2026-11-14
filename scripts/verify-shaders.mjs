import '../src/gpu/node-drivers.js';
import {vertex,fragments} from '../src/gpu/shaders.js';
import {spawnSync} from 'node:child_process';
const result=spawnSync('python',['scripts/verify-shaders.py'],{input:JSON.stringify({vertex,fragments}),encoding:'utf8'});process.stdout.write(result.stdout);process.stderr.write(result.stderr);process.exit(result.status??1);
