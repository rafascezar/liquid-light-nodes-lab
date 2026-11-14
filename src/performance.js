// Local, opt-in diagnostics. No network or user data collection.
export const diagnosticsEnabled=typeof location!=='undefined'&&new URLSearchParams(location.search).has('perf');
let counters={},samples={},started=0;
export function resetMetrics(){counters={};samples={};started=performance.now();}
export function countMetric(key,n=1){if(diagnosticsEnabled)counters[key]=(counters[key]||0)+n;}
export function sampleMetric(key,value){if(!diagnosticsEnabled)return;const list=samples[key]||(samples[key]=[]);if(list.length===1800)list.shift();list.push(value);}
export function metricsSnapshot(){const timing={};for(const [key,list]of Object.entries(samples)){const sorted=[...list].sort((a,b)=>a-b);timing[key]={mean:+(list.reduce((a,b)=>a+b,0)/list.length).toFixed(2),p95:+sorted[Math.floor((sorted.length-1)*.95)].toFixed(2)};}return {seconds:+((performance.now()-started)/1000).toFixed(1),...counters,...timing};}
