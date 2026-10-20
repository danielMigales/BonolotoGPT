import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {analyze,avoidExactRepeat} from '../engine/model.js';
import {auditBacktest} from '../engine/evaluation.js';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const engine=await readFile('engine/model.js','utf8');
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
const template=await readFile('worker/template.js','utf8');
const icon=await readFile('web/icon.svg','utf8');
await writeFile('worker/index.js',template.replace('/*SEED*/',()=>JSON.stringify(seed)).replace('/*HTML*/',()=>JSON.stringify(html)).replace('/*ICON*/',()=>JSON.stringify(icon)).replace('/*AI_ENGINE*/',()=>engine.replaceAll('export ','')));
await mkdir('public',{recursive:true});
// GitHub Pages usa el mismo diseño con el JSON versionado; no depende del servidor Sites.
const staticHtml=html.replaceAll("'/api/draws'","'./data/draws.json'").replace("'/api/ai?window='+window","'./data/ai-analysis-'+window+'.json'").replaceAll('/api/draws?download=1','./data/draws.json');
await writeFile('public/index.html',staticHtml);
await cp('web/icon.svg','public/icon.svg');
await mkdir('public/data',{recursive:true});
await cp('data/draws.json','public/data/draws.json');
// La interfaz usa una única ventana fija: 7 sorteos.
for(const obsoleteWindow of [5,10,15,20,30,50]){
 await rm(`public/data/ai-analysis-${obsoleteWindow}.json`,{force:true});
}
const fixedWindow=7;
const defaultAnalysis=analyze(seed.draws,{window:fixedWindow});
if(defaultAnalysis.status==='ready'){
 defaultAnalysis.audit=auditBacktest(defaultAnalysis.rows);
 try{
  const history=JSON.parse(await readFile('data/forecast-history.json','utf8'));
  if(Array.isArray(history)&&history.length){
   const latestForecast=history.slice().sort((a,b)=>b.targetDate.localeCompare(a.targetDate))[0];
   if(latestForecast?.numbers?.length===6)defaultAnalysis.forecast.numbers=avoidExactRepeat(defaultAnalysis.forecast.numbers,latestForecast.numbers,defaultAnalysis.forecast.numberScores);
   defaultAnalysis.lastEvaluation=history.at(-1);
   defaultAnalysis.evaluationHistory=history.slice(-10);
  }
 }catch(error){if(error.code!=='ENOENT')throw error;}
}
if(defaultAnalysis.status==='ready'){
 await writeFile(`public/data/ai-analysis-${fixedWindow}.json`,JSON.stringify(defaultAnalysis));
 await writeFile('data/ai-analysis.json',JSON.stringify(defaultAnalysis,null,2)+'\n');
 await writeFile('data/ai-model.json',JSON.stringify(defaultAnalysis.modelState,null,2)+'\n');
}else{
 await rm(`public/data/ai-analysis-${fixedWindow}.json`,{force:true});
 await rm('data/ai-analysis.json',{force:true});
 await rm('data/ai-model.json',{force:true});
}
console.log(`Generados Worker y página estática: ${seed.draws.length} sorteos; análisis: ${defaultAnalysis.status}`);
