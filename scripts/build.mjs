import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {analyze,avoidExactRepeat,diversifyCombination,explainSelection} from '../engine/model.js';
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
 // Estudio exploratorio de todas las ventanas admitidas; no elige automáticamente
 // un ganador para evitar convertir una comparación retrospectiva en una promesa predictiva.
 defaultAnalysis.windowStudy=[5,7,10,15,20,30,50].map(window=>{
  const candidate=analyze(seed.draws,{window});
  if(candidate.status!=='ready')return {window,status:'insufficient',required:candidate.required,available:candidate.available};
  const audit=auditBacktest(candidate.rows,{randomTrialsPerDraw:100,nullReplicates:1000,bootstrapReplicates:1000,blockLength:window,seed:20261020+window});
  return {window,status:'ready',simulations:candidate.metrics.simulations,meanHits:candidate.metrics.meanHits,atLeastFour:candidate.metrics.atLeastFour,atLeastFourRate:candidate.metrics.atLeastFour/candidate.metrics.simulations,randomAtLeastFourProbability:candidate.baseline.atLeastFourProbability,randomMeanHits:audit.randomMeanHits,deltaVsRandom:audit.deltaVsRandom,ci95Delta:audit.ci95Delta,pValueOneSided:audit.pValueOneSided,supportsHistoricalSignal:audit.supportsHistoricalSignal};
 });
 try{
  const history=JSON.parse(await readFile('data/forecast-history.json','utf8'));
  const issued=JSON.parse(await readFile('data/forecast-issued.json','utf8').catch(error=>{if(error.code==='ENOENT')return '[]';throw error;}));
  if(Array.isArray(history)&&history.length){
   const latestForecast=history.slice().sort((a,b)=>b.targetDate.localeCompare(a.targetDate))[0];
   if(latestForecast?.numbers?.length===6)defaultAnalysis.forecast.numbers=avoidExactRepeat(defaultAnalysis.forecast.numbers,latestForecast.numbers,defaultAnalysis.forecast.numberScores);
   defaultAnalysis.forecast.secondNumbers=diversifyCombination(defaultAnalysis.forecast.numbers,defaultAnalysis.forecast.numberScores,3);
   // Mantiene las explicaciones alineadas con la combinación final tras evitar repeticiones.
   defaultAnalysis.forecast.selectionReasons=explainSelection(seed.draws,defaultAnalysis.forecast,fixedWindow);
   // La última aserción visible pertenece al análisis recién calculado con la ventana fija actual (7 sorteos).
   // El historial prospectivo puede contener versiones antiguas; no debe sobrescribir la aserción del laboratorio.
   defaultAnalysis.evaluationHistory=history.slice(-10);
  }
  const prospectiveEvaluations=Array.isArray(history)?history.filter(item=>item.evaluationType==='prospective'):[];
  const issuedList=Array.isArray(issued)?issued:[];
  const evaluatedTargets=new Set(prospectiveEvaluations.map(item=>item.targetDate));
  const prospectiveRecords=issuedList.map(item=>({targetDate:item.targetDate,trainedThrough:item.trainedThrough??null,issuedAt:item.issuedAt??null,version:item.version??null,window:item.window??null,status:item.status??(evaluatedTargets.has(item.targetDate)?'evaluated':'pending'),numbers:Array.isArray(item.numbers)?item.numbers:null,secondNumbers:Array.isArray(item.secondNumbers)?item.secondNumbers:null,actual:Array.isArray(item.actual)?item.actual:null,hits:Number.isInteger(item.hits)?item.hits:null,secondHits:Number.isInteger(item.secondHits)?item.secondHits:(Array.isArray(item.combinationHits)&&Number.isInteger(item.combinationHits[1])?item.combinationHits[1]:null)})).sort((a,b)=>b.targetDate.localeCompare(a.targetDate));
  const evaluatedIssued=prospectiveRecords.filter(item=>item.status==='evaluated'&&Array.isArray(item.actual)&&Number.isInteger(item.hits));
  defaultAnalysis.prospective={issuedCount:issuedList.length,evaluatedCount:evaluatedIssued.length,pendingCount:prospectiveRecords.filter(item=>item.status==='pending').length,latestTargetDate:issuedList.at(-1)?.targetDate??null,records:prospectiveRecords.slice(0,20)};
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
