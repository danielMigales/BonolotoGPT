import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {analyze} from '../engine/model.js';
import {auditBacktest} from '../engine/evaluation.js';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
await mkdir('public',{recursive:true});await writeFile('public/index.html',html);await rm('public/icon.svg',{force:true});await mkdir('public/data',{recursive:true});await cp('data/draws.json','public/data/draws.json');await cp('data/jackpot.json','public/data/jackpot.json');
// El laboratorio mantiene una ventana fija de siete sorteos, independiente del listado reciente.
const fixedWindow=7,report=analyze(seed.draws,{window:fixedWindow});
if(report.status==='ready'){report.audit=auditBacktest(report.rows);report.windowStudy=[5,7,10,15,20,30,50].map(window=>{const candidate=analyze(seed.draws,{window});if(candidate.status!=='ready')return {window,status:'insufficient',required:candidate.required,available:candidate.available};const audit=auditBacktest(candidate.rows,{bootstrapReplicates:1000,blockLength:window,seed:20261020+window});return {window,status:'ready',simulations:candidate.metrics.simulations,meanHits:candidate.metrics.meanHits,atLeastThree:candidate.metrics.atLeastThree,atLeastThreeRate:candidate.metrics.atLeastThree/candidate.metrics.simulations,atLeastFour:candidate.metrics.atLeastFour,atLeastFourRate:candidate.metrics.atLeastFour/candidate.metrics.simulations,ci95MeanHits:audit.ci95MeanHits};});await writeFile('public/data/ai-analysis-7.json',JSON.stringify(report));await writeFile('data/ai-analysis.json',JSON.stringify(report,null,2)+'\n');await writeFile('data/ai-model.json',JSON.stringify(report.modelState,null,2)+'\n');}else{await rm('public/data/ai-analysis-7.json',{force:true});await rm('data/ai-analysis.json',{force:true});await rm('data/ai-model.json',{force:true});}
console.log('Generada página estática: '+seed.draws.length+' sorteos; laboratorio IA: '+report.status+'.');
