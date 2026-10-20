import test from 'node:test';
import assert from 'node:assert/strict';
import {auditBacktest} from '../engine/evaluation.js';
test('Auditoría compara cada predicción con múltiples controles de las mismas fechas y es reproducible',()=>{
 const rows=Array.from({length:40},(_,i)=>({date:'2026-01-'+String(i+1).padStart(2,'0'),predicted:[1,2,3,4,5,6],actual:[1,2,3,4,5,6]}));
 const options={randomTrialsPerDraw:30,nullReplicates:300,bootstrapReplicates:300,seed:17};
 const a=auditBacktest(rows,options),b=auditBacktest(rows,options);
 assert.deepEqual(a,b);assert.equal(a.simulations,40);assert.equal(a.randomTrialsPerDraw,30);
 assert.equal(a.modelMeanHits,6);assert.ok(a.deltaVsRandom>0);assert.ok(a.ci95Delta[0]>0);assert.ok(a.pValueOneSided<.05);assert.equal(a.supportsHistoricalSignal,true);
});
test('Auditoría rechaza entradas vacías o predicciones mal formadas',()=>{
 assert.throws(()=>auditBacktest([]),/requiere predicciones/);
 assert.throws(()=>auditBacktest([{predicted:[1],actual:[1,2,3,4,5,6]}]),/inválida/);
});
