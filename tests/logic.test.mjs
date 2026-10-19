import test from 'node:test';
import assert from 'node:assert/strict';
import {frequencies,repeated,windowDraws,summarizeIssued} from '../web/logic.js';
import {parseDraw,validateArchive} from '../worker/index.js';
const draws=[{date:'2026-01-05',numbers:[1,2,3,4,5,6],refund:2,complementary:49},{date:'2026-01-03',numbers:[1,7,8,9,10,11],refund:2,complementary:48},{date:'2026-01-01',numbers:[1,2,12,13,14,15],refund:1,complementary:47}];
test('Frecuencias y repeticiones cuentan solo los seis números',()=>{assert.deepEqual(repeated(draws),[[1,3],[2,2]]);assert.equal(frequencies(draws).get(1),3);assert.equal(frequencies(draws).get(49),undefined);});
test('Ventana histórica respeta fecha y límite',()=>{assert.deepEqual(windowDraws(draws,'2026-01-03',1),[draws[1]]);assert.deepEqual(windowDraws(draws,'2025-12-31'),[]);});
test('Parser SELAE reconoce Bonoloto y no expone campos auxiliares',()=>{const row={game_id:'BONO',fecha_sorteo:'2026-01-01 21:42:00',id_sorteo:'1',combinacion:'01 - 02 - 03 - 04 - 05 - 06 C(7) R(0)'};const d=parseDraw(row);assert.equal(d.numbers.length,6);assert.equal(d.refund,undefined);assert.equal(d.complementary,undefined);assert.match(d.source,/bonoloto\.html/);assert.throws(()=>parseDraw({...row,game_id:'LAPR'}));});
test('Resumen de seguimiento mide aciertos de seis números',()=>{const r=summarizeIssued([{status:'published',version:'2.0.0',numbers:[1,2,3,4,5,6],actual:{numbers:[1,2,3,7,8,9]}},{status:'pending',actual:null,numbers:[1,2,3,4,5,6]}]);assert.equal(r.evaluated,1);assert.equal(r.three,1);assert.equal(r.pending,1);assert.equal(r.versions[0].evaluated,1);});
