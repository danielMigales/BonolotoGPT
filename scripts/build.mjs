import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {analyze,compareHalfLives} from '../engine/model.js';
import {auditBacktest} from '../engine/evaluation.js';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
await mkdir('public',{recursive:true});await writeFile('public/index.html',html);await rm('public/icon.svg',{force:true});await mkdir('public/data',{recursive:true});await cp('data/draws.json','public/data/draws.json');await cp('data/jackpot.json','public/data/jackpot.json');
const report=analyze(seed.draws,{window:7,halfLife:8});\nconst halfLifeComparison=compareHalfLives(seed.draws,{window:7,halfLives:[8,10,12]});\nreport.halfLifeComparison=halfLifeComparison;
if(report.status==='ready'){report.audit=auditBacktest(report.rows);await writeFile('public/data/ai-analysis-7.json',JSON.stringify(report));await writeFile('data/ai-analysis.json',JSON.stringify(report,null,2)+'\n');await writeFile('data/ai-model.json',JSON.stringify(report.modelState,null,2)+'\n');}else{await rm('public/data/ai-analysis-7.json',{force:true});await rm('data/ai-analysis.json',{force:true});await rm('data/ai-model.json',{force:true});}
console.log('Generada página estática: '+seed.draws.length+' sorteos; método único: recencia ponderada.');
