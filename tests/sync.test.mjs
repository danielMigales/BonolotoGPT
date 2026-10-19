import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker,{validateArchive,saveArchive,getData} from '../worker/index.js';
const seed=JSON.parse(await readFile(new URL('../data/draws.json',import.meta.url),'utf8'));
const fresh=()=>({...structuredClone(seed),checkedAt:new Date().toISOString()});
function bucket(initial){const data=new Map(initial?[['history/draws.json',JSON.stringify(initial)]]:[]);return {data,async get(key){return data.has(key)?{json:async()=>JSON.parse(data.get(key))}:null},async put(key,value){data.set(key,value)}};}
test('Carga validada persiste el histórico completo y permite leerlo sin red',async()=>{
 const BUCKET=bucket(seed),doc=fresh();let requests=0;const original=globalThis.fetch;globalThis.fetch=()=>{requests++;throw Error('sin red')};
 try{const saved=await saveArchive({BUCKET},doc);const a=await getData({BUCKET}),b=await getData({BUCKET});assert.deepEqual(a,saved);assert.deepEqual(a,b);assert.equal(a.warning,undefined);assert.equal(requests,0);}finally{globalThis.fetch=original;}
});
test('Rechaza archivos incompletos o malformados sin reemplazar el histórico',async()=>{
 for(const mutate of [d=>d.draws.splice(1,1),d=>d.draws[0].numbers[0]=50,d=>d.draws[0].refund=10,d=>d.source='otra',d=>d.checkedAt='incorrecta',d=>d.draws[0].id='<script>',d=>d.latestDate='2026-01-01',d=>d.draws[0].date='2026-02-30']){
  const BUCKET=bucket(seed),doc=fresh();mutate(doc);const before=BUCKET.data.get('history/draws.json');await assert.rejects(()=>saveArchive({BUCKET},doc));assert.equal(BUCKET.data.get('history/draws.json'),before);
 }
});
test('No elimina el último sorteo ni acepta una consulta anterior',async()=>{
 const doc=fresh();let BUCKET=bucket(doc);const missing=fresh();missing.draws.shift();missing.latestDate=missing.draws[0].date;await assert.rejects(()=>saveArchive({BUCKET},missing),/perder/);
 const older=fresh();older.checkedAt=new Date(Date.parse(doc.checkedAt)-1000).toISOString();await assert.rejects(()=>saveArchive({BUCKET},older),/retroceder/);
});
test('La URL oficial se reconstruye sin aceptar enlaces del cargador',()=>{const doc=fresh();doc.draws[0].source='javascript:alert(1)';assert.match(validateArchive(doc).draws[0].source,/^https:\/\/www.loteriasyapuestas.es\//);});
test('Endpoint acepta JSON de servicio y rechaza peticiones de navegador y métodos incorrectos',async()=>{
 const BUCKET=bucket(seed),doc=fresh();
 const post=origin=>new Request('https://test/api/sync',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(doc)});
 assert.equal((await worker.fetch(post('https://otra.test'),{BUCKET})).status,403);
 assert.equal((await worker.fetch(new Request('https://test/api/sync'),{BUCKET})).status,405);
 assert.equal((await worker.fetch(new Request('https://test/api/sync',{method:'POST',body:'{}'}),{BUCKET})).status,415);
 const res=await worker.fetch(post(),{BUCKET});assert.equal(res.status,200);assert.equal((await res.json()).count,seed.draws.length);
});
test('Un fallo de escritura mantiene la copia anterior y no confirma éxito',async()=>{
 const BUCKET=bucket(seed);BUCKET.put=async()=>{throw Error('fallo R2')};const before=BUCKET.data.get('history/draws.json');
 const res=await worker.fetch(new Request('https://test/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fresh())}),{BUCKET});assert.equal(res.status,422);assert.equal(BUCKET.data.get('history/draws.json'),before);
});
