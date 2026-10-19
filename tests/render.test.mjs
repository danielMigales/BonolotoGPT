import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('La interfaz de resultados muestra solo los seis números principales',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/Solo se cuentan los seis números principales/);assert.doesNotMatch(html,/d\.complementary/);assert.doesNotMatch(html,/rFreq=frequencies\(visible,'refund'\)/);assert.match(html,/function renderAi\(report\)/);});
test('El render del análisis usa solo métricas de aciertos',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/m\.randomMeanHits/);assert.match(html,/report\.forecast\.numbers\.map/);assert.match(html,/reintegro quedan fuera de los cálculos/);});
