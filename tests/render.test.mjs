import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('La interfaz no ofrece laboratorio ni predicciones',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 for(const marker of ['Laboratorio IA','id="ai-view"','function renderAi(report)','report.forecast.numbers.map','Combinación única','id="ai-forecast"']){
  assert.ok(!html.includes(marker),'La interfaz no debe incluir: '+marker);
 }
});
test('La portada no muestra logotipo, eslogan ni encabezados redundantes',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 for(const marker of ['<nav class="main-nav"','<h1>Resultados</h1>','bonoloto / archivo','Observa los números. Encuentra las coincidencias.','href="./icon.svg"','brand-icon','<header','header{','header>div{','.brand{','.brand-icon','smallcaps']) assert.ok(!html.includes(marker),"No debe quedar en la interfaz: "+marker);
 assert.match(html,/id="results-view"/);
 assert.match(html,/fetch\('\.\/data\/draws\.json'/);
});
test('La interfaz muestra los resultados sin etiquetas de procedencia',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/Histórico de resultados/);
 assert.doesNotMatch(html,/no una prueba de la fuente de importación individual|MANUAL · NO VERIFICADO|href="\$\{d\.source\}"/);
});
test('La interfaz permite introducir resultados manualmente',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/Introducir resultado/);
 assert.match(html,/id="manual-draw-form"/);
 assert.match(html,/manual-complementario/);
 assert.match(html,/manual-reintegro/);
});
test('La interfaz no muestra controles de recarga manual',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/Recargar|force-update|id="refresh"|forceRefresh/);
 assert.match(html,/La actualización automática volverá a intentarlo/);
});
test('El listado reciente y el histórico mantienen su paginación',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/Últimos 7/);
 assert.match(html,/const pageSize=mode==='recent'\?7:5/);
});
test('La portada no muestra el bote estimado ni el resumen de métricas',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/next-jackpot|jackpot-amount|loadJackpot|Bote siguiente/);
 assert.match(html,/<section class="stats" aria-label="Resumen del archivo" hidden>/);
});
