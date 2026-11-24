import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,patterns,MODEL_VERSION,nextDrawDate,pairFrequencies,scoreCombination,PAIR_HISTORY_START} from '../engine/model.js';
import {auditBacktest} from '../engine/evaluation.js';
function draws(count=8){const out=[];let date=new Date('2026-09-01T12:00:00Z');for(let i=0;i<count;i++){const numbers=Array.from({length:49},(_,j)=>((j*17+i*11)%49)+1).slice(0,6).sort((a,b)=>a-b);out.push({date:date.toISOString().slice(0,10),numbers});date.setUTCDate(date.getUTCDate()+1);}return out;}
const recentDraws=draws();
const report=analyze([{date:'2025-12-31',numbers:[40,41,42,43,44,45]},...recentDraws]);
test('El único método suma las frecuencias de parejas desde 2026',()=>{
 assert.deepEqual(report.methods,['Parejas habituales']);assert.equal(report.version,'4.0.0');
 assert.equal(report.objective.predictionStrategy,'highest-sum-of-pair-frequencies');
 assert.equal(report.forecast.numbers.length,6);assert.equal(report.forecast.alternatives.length,6);
 assert.equal(report.forecast.selectionReasons.length,6);assert.equal(report.forecast.alternativeSelectionReasons.length,6);
 assert.ok(report.forecast.sharedNumbers<=3);assert.equal(report.forecast.pairHistoryStart,PAIR_HISTORY_START);
 assert.equal(report.forecast.score,scoreCombination(report.forecast.numbers,pairFrequencies(recentDraws)));
 assert.equal(report.rows.length,1);
});
test('Las parejas cuentan una vez por sorteo y la puntuación suma las 15 parejas',()=>{
 const d=[{numbers:[1,2,3,4,5,6]},{numbers:[1,2,7,8,9,10]}],pairs=pairFrequencies(d);
 assert.equal(pairs.get('1-2'),2);assert.equal(pairs.get('1-3'),1);
 assert.equal(scoreCombination([1,2,3,4,5,6],pairs),16);
});
test('El análisis excluye sorteos anteriores al 1 de enero de 2026',()=>{
 assert.equal(report.drawCount,8);assert.equal(report.sourceStartDate,PAIR_HISTORY_START);
});
test('El backtest entrena solo con sorteos anteriores al objetivo',()=>{
 assert.equal(report.rows[0].trainingCount,7);assert.equal(report.rows[0].trainingEnd,recentDraws[6].date);
 assert.equal(report.rows[0].date,recentDraws[7].date);
});
test('Ventana mínima, fechas y estadísticas descriptivas',()=>{
 assert.equal(analyze(recentDraws.slice(0,7)).status,'insufficient');
 assert.throws(()=>analyze(recentDraws,{window:18}));
 assert.equal(nextDrawDate('2026-10-19'),'2026-10-20');assert.equal(MODEL_VERSION,'4.0.0');
 const p=patterns([{numbers:[1,2,3,4,5,6]},{numbers:[1,2,10,20,30,40]}]);
 assert.equal(p.frequency[0].count,2);assert.equal(p.pairs.find(x=>x.numbers.join('-')==='1-2').count,2);
});
test('La auditoría mantiene la evaluación de las dos combinaciones',()=>{
 const a=auditBacktest(report.rows);assert.equal(a.simulations,report.metrics.simulations);
 assert.ok(Number.isFinite(a.randomBaseline.meanHits));assert.ok(Number.isFinite(a.deltaVsRandom));
});
