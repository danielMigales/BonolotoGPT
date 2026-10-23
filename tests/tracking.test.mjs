import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,nextDrawDate,reconcileForecasts,diversifyCombination} from '../engine/model.js';
const archive={schemaVersion:1,startDate:'2026-01-01',source:'SELAE',checkedAt:'2026-10-18T10:00:00.000Z',draws:[],latestDate:null};let date=new Date('2026-09-08T12:00:00Z');for(let i=0;i<35;){if(date.getUTCDay()!==0){const numbers=Array.from({length:6},(_,j)=>((i*7+j*9)%49)+1).sort((a,b)=>a-b);archive.draws.unshift({id:String(i+1),date:date.toISOString().slice(0,10),numbers,source:'https://www.loteriasyapuestas.es/f/loterias/resultados/bonoloto.html?game_id=BONO&fecha_sorteo='+date.toISOString().slice(0,10).replaceAll('-','')});i++;}date.setUTCDate(date.getUTCDate()+1);}archive.latestDate=archive.draws[0].date;const report=analyze(archive.draws);
const before=new Date('2026-10-18T10:00:00Z');
test('Fecha del próximo sorteo: lunes a sábado',()=>{assert.equal(nextDrawDate('2026-10-17'),'2026-10-18');assert.equal(nextDrawDate('2026-10-19'),'2026-10-20');assert.equal(nextDrawDate('2026-10-22'),'2026-10-23');assert.equal(nextDrawDate('2026-12-31'),'2027-01-01');});
test('Guarda una propuesta pendiente sin inventar resultado ni aciertos',()=>{
 const r=reconcileForecasts([],report,archive.draws,before);
 assert.equal(r.active.targetDate,'2026-10-18');assert.equal(r.active.status,'pending');assert.equal(r.active.createdAt,before.toISOString());assert.equal(r.active.actual,null);assert.equal(r.active.hits,null);assert.equal(r.active.secondHits,null);assert.equal(r.active.combinationHits,null);
 const changed={...report,version:'otra',forecast:{...report.forecast,numbers:[1,2,3,4,5,6]}};
 assert.deepEqual(reconcileForecasts(r.records,changed,archive.draws,new Date('2026-10-19T10:00:00Z')).records,r.records);
});
test('Publicación oficial evalúa la propuesta original y crea la siguiente; conserva ambas',()=>{
 const pending=reconcileForecasts([],report,archive.draws,before);
 const ticket=pending.active;const other=Array.from({length:49},(_,i)=>i+1).filter(n=>!ticket.numbers.includes(n));
 const actual={...archive.draws[0],date:ticket.targetDate,id:'999999999',numbers:[...ticket.numbers.slice(0,3),...other.slice(0,3)].sort((a,b)=>a-b)};
 const draws=[actual,...archive.draws],nextReport=analyze(draws),now=new Date('2026-10-18T21:00:00Z');
 const reconciled=reconcileForecasts(pending.records,nextReport,draws,now);
 assert.equal(reconciled.active.targetDate,'2026-10-19');assert.equal(reconciled.active.status,'pending');assert.equal(reconciled.records.length,2);
 const old=reconciled.records.find(r=>r.targetDate==='2026-10-18');assert.equal(old.status,'published');assert.equal(old.publishedAt,now.toISOString());assert.equal(old.hits,3);assert.equal(old.secondHits,ticket.secondNumbers.filter(n=>actual.numbers.includes(n)).length);assert.deepEqual(old.combinationHits,[old.hits,old.secondHits]);assert.deepEqual(old.numbers,ticket.numbers);assert.equal(old.createdAt,ticket.createdAt);assert.deepEqual(old.actual.numbers,actual.numbers);
 const corrected=[{...actual,numbers:[...actual.numbers].reverse()},...archive.draws];
 const updated=reconcileForecasts(reconciled.records,nextReport,corrected,now).records.find(r=>r.targetDate===actual.date);
 assert.equal(updated.publishedAt,now.toISOString());assert.deepEqual(updated.numbers,ticket.numbers);
});
test('Histórico atrasado no permite registrar propuestas retrospectivas ni después del corte propio',()=>{
 assert.equal(reconcileForecasts([],report,archive.draws,new Date('2026-10-20T10:00:00Z')).active,null);
 assert.equal(reconcileForecasts([],report,archive.draws,new Date('2026-10-18T18:31:00Z')).active,null);
 assert.ok(reconcileForecasts([],report,archive.draws,new Date('2026-10-18T18:29:00Z')).active);
 assert.equal(reconcileForecasts([],{...report,warning:'Archivo antiguo'},archive.draws,before).active,null);
});
test('La predicción próxima contiene dos combinaciones distintas de seis números',()=>{const first=report.forecast.numbers,second=report.forecast.secondNumbers;assert.equal(first.length,6);assert.equal(second.length,6);assert.equal(new Set(first).size,6);assert.equal(new Set(second).size,6);assert.ok([...first,...second].every(n=>Number.isInteger(n)&&n>=1&&n<=49));assert.notDeepEqual(first,second);assert.equal(second.filter(n=>first.includes(n)).length,3);});

test('La segunda combinación conserva tres números principales y añade tres alternativos bien puntuados',()=>{
 const primary=[1,2,3,4,5,6];
 const scores=Array.from({length:49},(_,i)=>({number:i+1,score:49-i}));
 const second=diversifyCombination(primary,scores,3);
 assert.equal(second.length,6);
 assert.equal(new Set(second).size,6);
 assert.equal(second.filter(n=>primary.includes(n)).length,3);
 assert.deepEqual(second,[1,2,3,7,8,9]);
});
