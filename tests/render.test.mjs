import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('El Laboratorio IA está disponible y presenta una propuesta experimental de seis números',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/id="view-ai"[^>]*>Laboratorio IA/);
 assert.match(html,/id="ai-view"/);
 assert.match(html,/report\\.forecast\\.numbers\\.map/);
 assert.match(html,/function renderAi\\(report\\)/);
 assert.match(html,/Se necesitan al menos 8 sorteos oficiales/);
 assert.match(html,/Los patrones históricos no garantizan resultados futuros/);
});
test('La propuesta explica la selección y contrasta el sorteo anterior',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/Combinación única/);
 assert.match(html,/Justificación de los seis números/);
 assert.match(html,/repeatTrials/);
 assert.match(html,/ai-forecast-result/);
});
test('La interfaz muestra los resultados sin etiquetas de procedencia',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/Histórico de resultados/);
 assert.doesNotMatch(html,/no una prueba de la fuente de importación individual|MANUAL · NO VERIFICADO|href="\\$\\{d\\.source\\}"/);
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
test('El listado reciente muestra diez sorteos y el histórico mantiene cinco por página',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/Últimos 10/);
 assert.match(html,/const pageSize=mode==='recent'\\?10:5/);
 assert.match(html,/en esta ventana de 10/);
 assert.match(html,/dos de los diez sorteos visibles/);
});
test('La portada no muestra el bote estimado ni el resumen de métricas',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/next-jackpot|jackpot-amount|loadJackpot|Bote siguiente/);
 assert.match(html,/<section class="stats" aria-label="Resumen del archivo" hidden>/);
});
