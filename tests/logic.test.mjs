import test from 'node:test';import assert from 'node:assert/strict';
import {frequencies,repeated,windowDraws} from '../web/logic.js';
import worker,{parseDraw,validateHistory,getData} from '../worker/index.js';
const draws=[{date:'2026-01-05',numbers:[1,2,3,4,5,6],refund:2},{date:'2026-01-03',numbers:[1,7,8,9,10,11],refund:2},{date:'2026-01-01',numbers:[1,2,12,13,14,15],refund:1}];
test('Cuenta apariciones y distingue reintegros',()=>{assert.deepEqual(repeated(draws),[[1,3],[2,2]]);assert.deepEqual(repeated(draws,'refund'),[[2,2]]);assert.equal(frequencies(draws).get(1),3);assert.equal(frequencies(draws,'refund').get(1),1);});
test('La ventana histórica respeta la fecha y el límite',()=>{assert.deepEqual(windowDraws(draws,'2026-01-03',1),[draws[1]]);assert.deepEqual(windowDraws(draws,'2025-12-31'),[]);});
test('Parser SELAE valida rangos, unicidad y complementario',()=>{const row={game_id:'LAPR',fecha_sorteo:'2026-01-01 21:42:00',id_sorteo:'1',combinacion:'01 - 02 - 03 - 04 - 05 - 06 C(7) R(0)'};assert.equal(parseDraw(row).refund,0);for(const combinacion of ['01 - 01 - 03 - 04 - 05 - 06 C(7) R(0)','01 - 02 - 03 - 04 - 05 - 50 C(7) R(0)','01 - 02 - 03 - 04 - 05 - 06 C(1) R(0)'])assert.throws(()=>parseDraw({...row,combinacion}));});
test('Detecta huecos de calendario',()=>{const valid=draws.map((d,i)=>({...d,id:String(i)}));assert.doesNotThrow(()=>validateHistory(valid));assert.throws(()=>validateHistory(valid.filter(d=>d.date!=='2026-01-03')));});
test('Servidor devuelve HTML, gestiona 404 y restringe métodos',async()=>{assert.equal((await worker.fetch(new Request('https://test/'),{})).headers.get('content-type'),'text/html;charset=utf-8');assert.equal((await worker.fetch(new Request('https://test/no'),{})).status,404);assert.equal((await worker.fetch(new Request('https://test/',{method:'POST'}),{})).status,405);});
test('No pierde datos si el almacenamiento falla',async()=>{const d=await getData({BUCKET:{get(){throw Error('storage')}}});assert.ok(d.draws.length>=125);assert.ok(d.warning);});
test('Respuesta reciente usa archivo persistente sin consulta externa',async()=>{const d=await getData({BUCKET:{async get(){return {json:async()=>({checkedAt:new Date().toISOString(),draws,latestDate:draws[0].date})}}}});assert.equal(d.draws.length,3);});
test('Archivo antiguo conserva histórico y fecha de consulta con aviso',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('offline')};try{const d=await getData({BUCKET:{async get(){return {json:async()=>({checkedAt:'2026-01-01T00:00:00Z',draws,latestDate:draws[0].date})}}}});assert.equal(d.draws.length,3);assert.equal(d.checkedAt,'2026-01-01T00:00:00Z');assert.ok(d.warning);}finally{globalThis.fetch=original;}});

test('Resumen prospectivo excluye pendientes y calcula los aciertos originales por versión',async()=>{
 const {summarizeIssued}=await import('../web/logic.js');
 const record={targetDate:'2026-10-19',version:'1.2.0',numbers:[1,2,3,4,5,6],refund:4};
 const empty=summarizeIssued([{...record,status:'pending',actual:null}]);assert.equal(empty.evaluated,0);assert.equal(empty.pending,1);assert.equal(empty.refundRate,null);assert.equal(empty.refundInterval,null);
 const real=summarizeIssued([{...record,status:'published',hits:0,refundHit:false,actual:{numbers:[1,2,3,7,8,9],refund:4}},{...record,version:'1.3.0',status:'published',actual:{numbers:[7,8,9,10,11,12],refund:2}},{...record,status:'pending',actual:null}]);
 assert.equal(real.issued,3);assert.equal(real.evaluated,2);assert.equal(real.pending,1);assert.equal(real.refunds,1);assert.equal(real.three,1);assert.equal(real.joint,1);assert.equal(real.refundRate,.5);assert.equal(real.meanHits,1.5);assert.deepEqual(real.versions.map(v=>[v.version,v.evaluated,v.refunds]),[['1.2.0',1,1],['1.3.0',1,0]]);
 const single=summarizeIssued([{...record,status:'published',actual:{numbers:record.numbers,refund:4}}]);assert.ok(Math.abs(single.refundInterval[0]-.20654931437723745)<1e-9);assert.ok(Math.abs(single.refundInterval[1]-1)<1e-9);
});
