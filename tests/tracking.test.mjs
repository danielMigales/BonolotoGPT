import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {analyze,nextDrawDate,reconcileForecasts} from '../engine/model.js';
import {trackAnalysis,getAnalysis} from '../worker/index.js';
const archive=JSON.parse(await readFile(new URL('../data/draws.json',import.meta.url),'utf8'));
const report=analyze(archive.draws);
const before=new Date('2026-10-18T10:00:00Z');
test('Fecha del próximo sorteo: lunes, jueves, sábado y cambio de año',()=>{
 assert.equal(nextDrawDate('2026-10-17'),'2026-10-19');assert.equal(nextDrawDate('2026-10-19'),'2026-10-22');assert.equal(nextDrawDate('2026-10-22'),'2026-10-24');assert.equal(nextDrawDate('2026-12-31'),'2027-01-02');
});
test('Guarda una propuesta pendiente sin inventar resultado ni aciertos',()=>{
 const r=reconcileForecasts([],report,archive.draws,before);
 assert.equal(r.active.targetDate,'2026-10-19');assert.equal(r.active.status,'pending');assert.equal(r.active.createdAt,before.toISOString());assert.equal(r.active.actual,null);assert.equal(r.active.hits,null);assert.equal(r.active.refundHit,null);
 const changed={...report,version:'otra',forecast:{...report.forecast,numbers:[1,2,3,4,5,6],refund:9}};
 assert.deepEqual(reconcileForecasts(r.records,changed,archive.draws,new Date('2026-10-19T10:00:00Z')).records,r.records);
});
test('Publicación oficial evalúa la propuesta original y crea la siguiente; conserva ambas',()=>{
 const pending=reconcileForecasts([],report,archive.draws,before);
 const ticket=pending.active;const other=Array.from({length:49},(_,i)=>i+1).filter(n=>!ticket.numbers.includes(n));
 const actual={...archive.draws[0],date:ticket.targetDate,id:'999999999',numbers:[...ticket.numbers.slice(0,3),...other.slice(0,3)].sort((a,b)=>a-b),refund:ticket.refund};
 const draws=[actual,...archive.draws],nextReport=analyze(draws),now=new Date('2026-10-19T21:00:00Z');
 const reconciled=reconcileForecasts(pending.records,nextReport,draws,now);
 assert.equal(reconciled.active.targetDate,'2026-10-22');assert.equal(reconciled.active.status,'pending');assert.equal(reconciled.records.length,2);
 const old=reconciled.records.find(r=>r.targetDate==='2026-10-19');assert.equal(old.status,'published');assert.equal(old.publishedAt,now.toISOString());assert.equal(old.hits,3);assert.equal(old.refundHit,true);assert.deepEqual(old.numbers,ticket.numbers);assert.equal(old.createdAt,ticket.createdAt);assert.deepEqual(old.actual.numbers,actual.numbers);
 const corrected=[{...actual,refund:(actual.refund+1)%10},...archive.draws];
 const updated=reconcileForecasts(reconciled.records,nextReport,corrected,now).records.find(r=>r.targetDate===actual.date);
 assert.equal(updated.refundHit,false);assert.equal(updated.publishedAt,now.toISOString());assert.deepEqual(updated.numbers,ticket.numbers);assert.equal(updated.refund,ticket.refund);
});
test('Histórico atrasado no permite registrar propuestas retrospectivas ni después del corte propio',()=>{
 assert.equal(reconcileForecasts([],report,archive.draws,new Date('2026-10-20T10:00:00Z')).active,null);
 assert.equal(reconcileForecasts([],report,archive.draws,new Date('2026-10-19T18:31:00Z')).active,null);
 assert.ok(reconcileForecasts([],report,archive.draws,new Date('2026-10-19T18:29:00Z')).active);
 assert.equal(reconcileForecasts([],{...report,warning:'Archivo antiguo'},archive.draws,before).active,null);
});
test('La caché conserva el registro y no pierde propuestas por una escritura concurrente',async()=>{
 const map=new Map(),pending=reconcileForecasts([],report,archive.draws,before);let conflict=true;
 const BUCKET={async get(key){if(key==='history/draws.json')return {json:async()=>archive};return map.has(key)?{etag:'revision',json:async()=>JSON.parse(map.get(key))}:null;},async put(key,value,options){if(key==='ai/tracking/30.json'&&conflict){conflict=false;assert.equal(options.onlyIf.etagDoesNotMatch,'*');map.set(key,JSON.stringify({records:pending.records}));return null;}map.set(key,value);return {etag:'revision'};}};
 const first=await trackAnalysis({BUCKET},archive,report);assert.deepEqual(first.tracking.records,pending.records);assert.equal(first.tracking.persisted,true);
 map.set('ai/reports/30.json',JSON.stringify({signature:'ai:'+report.version+':'+JSON.stringify(archive.draws.map(d=>[d.date,d.numbers,d.refund])),report}));
 const second=await getAnalysis({BUCKET},30);assert.deepEqual(second.tracking.records,first.tracking.records);assert.equal(second.forecast.targetDate,'2026-10-19');
});
