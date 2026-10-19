import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {analyze,patterns,randomBaseline,MODEL_VERSION,brierScore} from '../engine/model.js';
import worker,{getAnalysis} from '../worker/index.js';
const archive=JSON.parse(await readFile(new URL('../data/draws.json',import.meta.url),'utf8'));
const chronological=archive.draws.slice().reverse();
const report=analyze(archive.draws);
test('95 pruebas con 30 sorteos iniciales; cada predicción usa solo su pasado',()=>{
 assert.equal(report.rows.length,archive.draws.length-30);
 for(const row of report.rows){assert.ok(row.trainingEnd<row.date);assert.equal(row.predicted.length,6);assert.equal(new Set(row.predicted).size,6);assert.ok(row.predicted.every(n=>n>=1&&n<=49));assert.ok(row.refund>=0&&row.refund<=9);assert.equal(row.hits,row.predicted.filter(n=>row.actual.includes(n)).length);}
 assert.equal(report.metrics.atLeastFour,report.rows.filter(r=>r.hits>=4).length);assert.equal(report.metrics.refundHits,report.rows.filter(r=>r.refund===r.actualRefund).length);
});
test('Modificar el resultado objetivo y los futuros no altera la predicción previa',()=>{
 const data=structuredClone(chronological);data[30].numbers=[1,2,3,4,5,6];data[30].refund=9;
 for(let i=31;i<data.length;i++){data[i].numbers=[2,4,6,8,10,12];data[i].refund=8;}
 const changed=analyze(data);assert.deepEqual(changed.rows[0].predicted,report.rows[0].predicted);assert.equal(changed.rows[0].refund,report.rows[0].refund);assert.deepEqual(changed.rows[0].weightsBefore,report.rows[0].weightsBefore);
 const prefix=analyze(chronological.slice(0,36));assert.deepEqual(prefix.rows,report.rows.slice(0,6));
});
test('Resultados deterministas, sin modificar el histórico; aprende pesos distintos',()=>{
 const original=JSON.stringify(archive.draws);assert.deepEqual(analyze(archive.draws),report);assert.equal(JSON.stringify(archive.draws),original);
 assert.ok(report.experts.some(e=>e.numberWeight!==.2));assert.ok(Math.abs(report.modelState.numberWeights.reduce((a,b)=>a+b,0)-1)<1e-9);assert.ok(Math.abs(report.modelState.refundWeights.reduce((a,b)=>a+b,0)-1)<1e-9);
});
test('Referencia de azar exacta y probabilidades normalizadas',()=>{const b=randomBaseline();assert.equal(b.expectedHits,36/49);assert.ok(Math.abs(b.hitProbabilities.reduce((a,b)=>a+b,0)-1)<1e-10);assert.ok(b.atLeastFourProbability>0&&b.atLeastFourProbability<.01);assert.equal(b.refundProbability,.1);});
test('Frecuencias, parejas, paridad y distancias se calculan de las combinaciones',()=>{
 const p=patterns([{numbers:[1,2,3,4,5,6],refund:0},{numbers:[1,2,10,20,30,40],refund:0}]);assert.equal(p.frequency[0].count,2);assert.equal(p.refunds[0].count,2);assert.equal(p.pairs.find(x=>x.numbers.join('-')==='1-2').count,2);assert.equal(p.parity.find(x=>x.even===3).count,1);assert.equal(p.parity.find(x=>x.even===5).count,1);assert.equal(p.gaps[0].count,6);
});
test('Rechaza ventanas inválidas, duplicados y señala datos insuficientes',()=>{
 assert.throws(()=>analyze(archive.draws,{window:0}));assert.throws(()=>analyze(archive.draws,{window:18}));assert.throws(()=>analyze([...archive.draws,archive.draws[0]]));assert.equal(analyze(chronological.slice(0,30)).status,'insufficient');for(const window of [5,10,15,20,30,50])assert.equal(analyze(archive.draws,{window}).rows.length,archive.draws.length-window);
});
test('El análisis se guarda, se reutiliza y cambia al corregir resultados oficiales',async()=>{
 let doc=structuredClone(archive);const map=new Map();const BUCKET={async get(key){if(key==='history/draws.json')return {json:async()=>doc};return map.has(key)?{json:async()=>JSON.parse(map.get(key))}:null;},async put(key,val){map.set(key,val);}};
 const first=await getAnalysis({BUCKET},30);assert.ok(map.has('ai/models/30.json'));assert.ok(map.has('ai/forecasts/'+MODEL_VERSION+'/30/after-'+archive.latestDate+'.json'));assert.deepEqual(await getAnalysis({BUCKET},30),first);
 doc=structuredClone(doc);doc.draws[0].refund=(doc.draws[0].refund+1)%10;
 const next=await getAnalysis({BUCKET},30);assert.notEqual(next.rows.at(-1).actualRefund,first.rows.at(-1).actualRefund);
 const res=await worker.fetch(new Request('https://test/api/ai?window=0'),{BUCKET});assert.equal(res.status,400);
});

test('La API fija 15 sorteos y rechaza ventanas alternativas',async()=>{
 const response=await worker.fetch(new Request('https://test/api/ai'),{});
 assert.equal(response.status,200);
 assert.equal((await response.json()).window,15);
 const alternative=await worker.fetch(new Request('https://test/api/ai?window=30'),{});
 assert.equal(alternative.status,400);
 assert.match((await alternative.json()).error,/ventana fija de 15 sorteos/);
});
test('La prioridad es reintegro y mide tres aciertos y ambos sin mezclarlos',()=>{assert.equal(report.objective.primary,'refund');assert.equal(report.metrics.atLeastThree,report.rows.filter(r=>r.hits>=3).length);assert.equal(report.metrics.atLeastThreeAndRefund,report.rows.filter(r=>r.hits>=3&&r.refundHit).length);assert.equal(report.metrics.randomAtLeastThreeAndRefund,report.rows.filter(r=>r.randomHits>=3&&r.randomRefundHit).length);assert.ok(Math.abs(report.baseline.threeAndRefundProbability-report.baseline.atLeastThreeProbability*.1)<1e-12);});

test('Brier se calcula sobre las diez categorías y conserva probabilidades válidas',()=>{assert.ok(Math.abs(brierScore(Array(10).fill(.1),4)-.9)<1e-12);assert.equal(brierScore([1,0,0,0,0,0,0,0,0,0],0),0);assert.equal(brierScore([1,0,0,0,0,0,0,0,0,0],1),2);for(const r of report.rows){assert.equal(r.refundProbabilities.length,10);assert.ok(r.refundProbabilities.every(p=>p>0&&p<1));assert.ok(Math.abs(r.refundProbabilities.reduce((a,b)=>a+b,0)-1)<1e-10);assert.ok(Math.abs(brierScore(r.refundProbabilities,r.actualRefund)-r.refundBrier)<1e-12);assert.ok(Number.isFinite(r.refundLogLoss));}});
test('Siete expertos y referencia reproducida sobre las mismas fechas y boletos',()=>{assert.equal(report.experts.length,7);assert.ok(report.experts.some(e=>e.name==='Bayes regularizado'));assert.ok(report.experts.some(e=>e.name==='Markov regularizado'));assert.ok(report.experts.every(e=>e.initialWeight===1/7));const old=analyze(archive.draws,{variant:'legacy'});assert.equal(old.version,'1.1.0');assert.equal(old.experts.length,5);assert.equal(old.rows.length,report.rows.length);assert.deepEqual(old.rows.map(r=>r.date),report.rows.map(r=>r.date));assert.deepEqual(report.reference.metrics,old.metrics);assert.equal(old.modelState.version,'1.1.0');});
