import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {analyze} from '../engine/model.js';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
const logic=await readFile(new URL('../web/logic.js',import.meta.url),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace('/*LOGIC*/',logic.replaceAll('export ',''));
const seed=JSON.parse(await readFile(new URL('../data/draws.json',import.meta.url),'utf8'));
async function renderData(data,reportOverride=null){
 const elements=new Map();
 const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,{value:id==='from'?'2026-01-01':'',innerHTML:'',textContent:'',hidden:true,setAttribute(){},setCustomValidity(){},reportValidity(){}});return elements.get(id);}};
 for(const match of html.matchAll(/id="([^"]+)"/g))document.getElementById(match[1]);
 vm.runInNewContext(script,{document,fetch:async url=>({ok:true,json:async()=>String(url).includes('/api/ai')?(reportOverride||analyze(data.draws,{window:Number(String(url).split('window=')[1])||30})):data}),setInterval(){},Date,Map,Error,console});
 await new Promise(resolve=>setImmediate(resolve));
 return elements;
}
for(const [name,refunds] of [['únicos',[0,1,2,3,4]],['mixtos',[0,0,2,3,4]],['iguales',[0,0,0,0,0]]]){
 test('Muestra cinco sorteos con reintegros '+name,async()=>{
  const data={...seed,draws:seed.draws.slice(0,5).map((d,i)=>({...d,refund:refunds[i]}))};
  const els=await renderData(data);
  assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
  assert.equal(els.get('notice').hidden,true);
  assert.doesNotMatch(els.get('draws').innerHTML,/undefined|Cargando/);
  els.get('history').onclick();
  assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
 });
}
test('Muestra datos reales y permite paginar el histórico',async()=>{
 const els=await renderData(seed);
 assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
 assert.equal(els.get('notice').hidden,true);
 els.get('history').onclick();const first=els.get('draws').innerHTML;
 els.get('next').onclick();assert.notEqual(els.get('draws').innerHTML,first);
 assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
});
test('Consultar confirma el intervalo amplio de la captura y permite ver los antiguos',async()=>{
 const els=await renderData(seed);els.get('history').onclick();
 els.get('from').value='2026-08-17';els.get('until').value='2026-10-18';els.get('order').value='desc';
 const submit=()=>els.get('filters').onsubmit({preventDefault(){}});submit();
 const count=seed.draws.filter(d=>d.date>='2026-08-17'&&d.date<='2026-10-18').length;
 assert.match(els.get('query-summary').textContent,new RegExp('Consulta aplicada · '+count+' sorteos'));
 assert.match(els.get('query-summary').textContent,/17\/08\/2026.*18\/10\/2026/);
 assert.match(els.get('page-label').textContent,new RegExp('1–5 de '+count));
 assert.equal(els.get('pager').hidden,false);
 els.get('order').value='asc';submit();
 assert.match(els.get('draws').innerHTML,/17 de agosto de 2026/);
 assert.match(els.get('query-summary').textContent,/Más antiguos primero/);
});
test('El filtro incluye los extremos y muestra una consulta vacía sin resultados antiguos',async()=>{
 const els=await renderData(seed);els.get('history').onclick();
 els.get('from').value='2026-01-01';els.get('until').value='2026-01-03';els.get('filters').onsubmit({preventDefault(){}});
 assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,2);
 assert.match(els.get('query-summary').textContent,/2 sorteos encontrados/);
 els.get('from').value='2026-01-02';els.get('until').value='2026-01-02';els.get('filters').onsubmit({preventDefault(){}});
 assert.match(els.get('draws').innerHTML,/No hay sorteos/);assert.match(els.get('query-summary').textContent,/0 sorteos encontrados/);assert.equal(els.get('pager').hidden,true);
});
test('Paginar respeta la consulta aplicada hasta pulsar Consultar de nuevo',async()=>{
 const els=await renderData(seed);els.get('history').onclick();
 els.get('from').value='2026-01-01';els.get('until').value='2026-01-31';els.get('filters').onsubmit({preventDefault(){}});
 els.get('until').value='2026-10-18';els.get('next').onclick();
 assert.match(els.get('page-label').textContent,/6–10 de 14/);
 assert.match(els.get('query-summary').textContent,/31\/01\/2026/);
});
test('Corregir cualquiera de las fechas permite repetir la consulta',async()=>{
 const els=await renderData(seed);els.get('history').onclick();let validity='';els.get('until').setCustomValidity=v=>{validity=v;};
 els.get('from').value='2026-10-18';els.get('until').value='2026-01-01';els.get('filters').onsubmit({preventDefault(){}});assert.ok(validity);
 els.get('from').value='2026-01-01';els.get('from').oninput();assert.equal(validity,'');els.get('filters').onsubmit({preventDefault(){}});
 assert.match(els.get('query-summary').textContent,/1 sorteo encontrado/);
});

test('El laboratorio muestra predicción, métricas, pesos y pruebas históricas',async()=>{
 const els=await renderData(seed);els.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(els.get('ai-content').hidden,false);assert.equal(els.get('ai-error').hidden,true);assert.equal(els.get('ai-count').textContent,seed.draws.length-15);
 assert.equal((els.get('ai-forecast').innerHTML.match(/class="ball/g)||[]).length,7);assert.match(els.get('ai-detail').innerHTML,/Predicción previa/);assert.match(els.get('ai-weights').innerHTML,/Frecuencia acumulada/);
 const first=els.get('ai-log').innerHTML;els.get('ai-next').onclick();assert.notEqual(els.get('ai-log').innerHTML,first);els.get('ai-target').value='0';els.get('ai-target').onchange();assert.match(els.get('ai-detail').innerHTML,/15 sorteos anteriores/);
 els.get('view-results').onclick();assert.equal(els.get('ai-view').hidden,true);assert.equal(els.get('results-view').hidden,false);
});

test('La propuesta muestra fecha y resultado pendiente, y conserva la comparación publicada debajo',async()=>{
 const report=analyze(seed.draws);report.tracking={targetDate:'2026-10-19',active:{...report.forecast,trainingCount:125,trainedThrough:'2026-10-17'},records:[{targetDate:'2026-10-15',numbers:[1,2,3,4,5,6],refund:4,status:'published',actual:{numbers:[1,2,3,7,8,9],refund:4},hits:3,refundHit:true}]};
 const els=await renderData(seed,report);els.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.match(els.get('ai-forecast-date').textContent,/19 de octubre de 2026/);assert.match(els.get('ai-forecast-result').innerHTML,/Resultado sin publicar/);
 const history=els.get('ai-forecast-history').innerHTML;assert.match(history,/15 de octubre de 2026/);assert.ok(history.indexOf('Propuesta guardada')<history.indexOf('Resultado oficial'));assert.match(history,/3 de 6 aciertos · Reintegro acertado/);assert.match(history,/refund-gold/);
});

test('La propuesta explica criterios reales y evita atribuir puntuaciones a una combinación distinta',async()=>{
 const report=analyze(seed.draws);
 const els=await renderData(seed,report);els.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.match(els.get('ai-forecast-explanation').innerHTML,/¿Por qué esta combinación\?/);
 assert.match(els.get('ai-forecast-explanation').innerHTML,/puesto [0-9]+ de 49/);
 assert.match(els.get('ai-forecast-explanation').innerHTML,/todas las combinaciones de seis números tienen la misma probabilidad/);
 const stored=structuredClone(report);stored.tracking={persisted:true,targetDate:report.forecast.targetDate,active:{...report.forecast,numbers:[1,2,3,4,5,6],refund:9,trainingCount:report.drawCount,trainedThrough:report.sourceLastDate},records:[]};
 const saved=await renderData(seed,stored);saved.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.match(saved.get('ai-forecast-explanation').innerHTML,/no coincide con la combinación recalculada/);
 assert.doesNotMatch(saved.get('ai-forecast-explanation').innerHTML,/puesto [0-9]+ de 49/);
});
test('Resumen real muestra pendientes sin mezclar las simulaciones y mantiene el detalle plegado',async()=>{
 const report=analyze(seed.draws);report.tracking={persisted:true,records:[{version:'1.2.0',targetDate:'2026-10-19',status:'pending',actual:null}]};
 const els=await renderData(seed,report);els.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(els.get('ai-real-issued').textContent,1);assert.equal(els.get('ai-real-evaluated').textContent,0);assert.equal(els.get('ai-real-refunds').textContent,'—');assert.match(els.get('ai-real-status').textContent,/1 propuesta pendiente/);assert.match(els.get('ai-real-uncertainty').textContent,/no se suman/);assert.match(els.get('ai-sync-status').textContent,/SELAE.*último sorteo/);assert.equal((html.match(/<details class="ai-fold">/g)||[]).length,1);assert.match(html,/<details class="ai-fold" hidden><summary>Métodos y aprendizaje del motor<\/summary>/);assert.equal(html.includes('Simulaciones históricas · resultados y pruebas'),false);
});
test('Resumen real presenta aciertos y versiones solo tras recibir resultados oficiales',async()=>{
 const report=analyze(seed.draws);report.tracking={persisted:true,records:[{version:'1.2.0',targetDate:'2026-10-15',numbers:[1,2,3,4,5,6],refund:4,status:'published',actual:{numbers:[1,2,3,7,8,9],refund:4},hits:3,refundHit:true}]};
 const els=await renderData(seed,report);els.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(els.get('ai-real-refunds').textContent,'1 / 1');assert.equal(els.get('ai-real-three').textContent,'1 / 1');assert.match(els.get('ai-real-status').textContent,/Ambos objetivos: 1 \/ 1/);assert.match(els.get('ai-real-uncertainty').textContent,/Wilson/);assert.match(els.get('ai-real-versions').innerHTML,/1.2.0/);
});

test('El laboratorio fija 15 sorteos y elimina el desplegable',async()=>{
 const els=await renderData(seed);els.get('view-ai').onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(html.includes('id="ai-window"'),false);
 assert.match(html,/Ventana de análisis[\s\S]*?15 sorteos/);
 assert.equal(els.get('ai-count').textContent,seed.draws.length-15);
});
test('Todos los selectores del HTML apuntan a IDs existentes y únicos',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 const idSet=new Set(ids);
 assert.equal(idSet.size,ids.length,'El HTML no debe contener IDs duplicados');
 const refs=[...html.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(match=>match[1]);
 const missing=[...new Set(refs.filter(id=>!idSet.has(id)))];
 assert.deepEqual(missing,[],'Cada selector $() debe apuntar a un elemento existente');
});
