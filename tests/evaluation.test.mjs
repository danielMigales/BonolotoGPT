import test from 'node:test';
import assert from 'node:assert/strict';
import {auditBacktest} from '../engine/evaluation.js';
test('Auditoría resume aciertos históricos con bootstrap por bloques y es reproducible',()=>{
 const rows=Array.from({length:40},(_,i)=>({date:'2026-01-'+String(i+1).padStart(2,'0'),predicted:[1,2,3,4,5,6],actual:[1,2,3,4,5,6]}));
 const options={bootstrapReplicates:300,blockLength:7,seed:17};
 const a=auditBacktest(rows,options),b=auditBacktest(rows,options);
 assert.deepEqual(a,b);assert.equal(a.simulations,40);assert.equal(a.bootstrapReplicates,300);
 assert.equal(a.meanHits,6);assert.deepEqual(a.ci95MeanHits,[6,6]);assert.equal(a.atLeastFour,40);
 assert.equal('randomMeanHits' in a,false);assert.equal('pValueOneSided' in a,false);
});
test('Auditoría rechaza entradas vacías o predicciones mal formadas',()=>{
 assert.throws(()=>auditBacktest([]),/requiere predicciones/);
 assert.throws(()=>auditBacktest([{predicted:[1],actual:[1,2,3,4,5,6]}]),/inválida/);
});
