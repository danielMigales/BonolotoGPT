import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('El laboratorio prioriza únicamente los seis números principales',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/Objetivo único: acertar los seis números principales/);assert.doesNotMatch(html,/reintegro|refund|complementari/i);assert.doesNotMatch(html,/ai-real-refunds|ai-refund-rate|refund-gold|refund-pred/i);assert.match(html,/function renderAi\(report\)/);});
test('La predicción y las estadísticas se renderizan con seis números',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/report\.forecast\.numbers\.map/);assert.match(html,/report\.patterns\.frequency/);assert.match(html,/Se necesitan al menos 8 sorteos oficiales/);});

test('La interfaz explica la procedencia mixta del histórico sin atribuir cada fila a SELAE',async()=>{const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');assert.match(html,/las fechas recientes pueden completarse desde un histórico alternativo/);assert.match(html,/no una prueba de la fuente de importación individual/);assert.match(html,/Frecuencias contrastadas con SELAE/);});
