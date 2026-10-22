import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('El laboratorio prioriza únicamente los seis números principales',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/Objetivo único: acertar los seis números principales/);assert.doesNotMatch(html,/reintegro|refund|complementari/i);assert.doesNotMatch(html,/ai-real-refunds|ai-refund-rate|refund-gold|refund-pred/i);assert.match(html,/function renderAi\(report\)/);});
test('La predicción y las estadísticas se renderizan con seis números',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/report\.forecast\.numbers\.map/);assert.match(html,/report\.patterns\.frequency/);assert.match(html,/Se necesitan al menos 8 sorteos oficiales/);});

test('La interfaz explica la procedencia mixta del histórico sin atribuir cada fila a SELAE',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/las fechas recientes pueden completarse desde un histórico alternativo/);assert.match(html,/no una prueba de la fuente de importación individual/);assert.match(html,/Frecuencias contrastadas con SELAE/);});

test('El laboratorio presenta la auditoría estadística y sus límites',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/Auditoría estadística frente al azar/);assert.match(html,/ai-audit-ci/);assert.match(html,/ai-audit-p/);assert.match(html,/no demuestra por sí sola una ventaja futura/);});

test('La interfaz muestra el estado del registro prospectivo separado del backtest histórico',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/registro prospectivo:/);assert.match(html,/report\.prospective\?\.issuedCount/);assert.match(html,/report\.prospective\?\.evaluatedCount/);assert.match(html,/report\.prospective\?\.pendingCount/);assert.match(html,/id="prospective-status"/);assert.match(html,/La predicción para el/);});

test('La interfaz no muestra botones Recargar y mantiene la actualización automática',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/Recargar|force-update|id="refresh"|forceRefresh/);assert.match(html,/load\(\);setInterval\(\(\)=>\{if\(!document\.hidden\)\{load\(\);if\(!\$\('ai-view'\)\.hidden\)loadAi\(\);\}\},15\*60\*1000\)/);assert.match(html,/La actualización automática volverá a intentarlo/);});

test('La predicción muestra dos combinaciones distintas',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/Combinación 1 · principal/);assert.match(html,/Combinación 2 · diversificada/);assert.match(html,/report\.forecast\.secondNumbers/);});
