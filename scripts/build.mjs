import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {analyze,avoidExactRepeat} from '../engine/model.js';
import {auditBacktest} from '../engine/evaluation.js';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
await mkdir('public',{recursive:true});
// GitHub Pages publica una aplicación estática que lee los JSON versionados.
await writeFile('public/index.html',html);
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
  const issued=JSON.parse(await readFile('data/forecast-issued.json','utf8').catch(error=>{if(error.code==='ENOENT')return '[]';throw error;}));
  if(Array.isArray(history)&&history.length){
   const latestForecast=history.slice().sort((a,b)=>b.targetDate.localeCompare(a.targetDate))[0];
   if(latestForecast?.numbers?.length===6)defaultAnalysis.forecast.numbers=avoidExactRepeat(defaultAnalysis.forecast.numbers,latestForecast.numbers,defaultAnalysis.forecast.numberScores);
   // La última aserción visible pertenece al análisis recién calculado con la ventana fija actual (7 sorteos).
   // El historial prospectivo puede contener versiones antiguas; no debe sobrescribir la aserción del laboratorio.
   defaultAnalysis.evaluationHistory=history.slice(-10);
  }
  const prospectiveEvaluations=Array.isArray(history)?history.filter(item=>item.evaluationType==='prospective'):[];
  const issuedList=Array.isArray(issued)?issued:[];
  const evaluatedTargets=new Set(prospectiveEvaluations.map(item=>item.targetDate));
  defaultAnalysis.prospective={issuedCount:issuedList.length,evaluatedCount:prospectiveEvaluations.length,pendingCount:issuedList.filter(item=>!evaluatedTargets.has(item.targetDate)).length,latestTargetDate:issuedList.at(-1)?.targetDate??null};
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
console.log(`Generada página estática: ${seed.draws.length} sorteos; análisis: ${defaultAnalysis.status}`);
