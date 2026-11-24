import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const staticHtml = await readFile(resolve(projectRoot, "public/index.html"), "utf8");
const publicArchive = JSON.parse(await readFile(resolve(projectRoot, "public/data/draws.json"), "utf8"));
const sourceArchive = JSON.parse(await readFile(resolve(projectRoot, "data/draws.json"), "utf8"));

assert.ok(!staticHtml.includes('href="./icon.svg"'), "La web no debe mostrar el favicon de marca");
assert.ok(!staticHtml.includes('<img src="./icon.svg" alt="">'), "La web no debe mostrar el logotipo");
for (const marker of ["brand-icon", "header{", "header>div{", ".brand{", ".edition{"]) assert.ok(!staticHtml.includes(marker), "El artefacto no debe conservar estilos de marca: " + marker);
assert.ok(!staticHtml.includes("<header"), "La web no debe conservar la cabecera de marca");
await assert.rejects(readFile(resolve(projectRoot, "public/icon.svg"), "utf8"), "El icono de marca no debe publicarse");

assert.ok(staticHtml.includes("Histórico de resultados"));
assert.ok(staticHtml.includes("Últimos 10"), "La portada debe mostrar diez sorteos recientes");
assert.ok(staticHtml.includes("const pageSize=mode==='recent'?10:5"), "El histórico debe conservar cinco sorteos por página");
assert.ok(staticHtml.includes("en esta ventana de 10"));
assert.ok(staticHtml.includes("dos de los diez sorteos visibles"));
assert.ok(staticHtml.includes("id=\"view-ai\""), "Debe existir la pestaña del Laboratorio IA");
assert.ok(staticHtml.includes("id=\"ai-view\""), "Debe existir el panel del Laboratorio IA");
assert.ok(staticHtml.includes("fetch('./data/ai-analysis-'+window+'.json'"), "El laboratorio debe cargar el informe generado");
assert.ok(staticHtml.includes("function renderAi(report)"), "El laboratorio debe representar el informe");
assert.ok(staticHtml.includes('id="recent-repetitions-card"'), "El laboratorio debe mostrar las repeticiones de la última semana");
assert.ok(staticHtml.includes('id="ai-sync-status" class="ai-sync-status" role="status" hidden'), "El estado técnico debe conservar su anclaje sin mostrarse");
assert.ok(staticHtml.includes("Análisis completado"), "El laboratorio debe mostrar un estado breve");
assert.ok(!staticHtml.includes("Los patrones históricos no garantizan resultados futuros"), "No debe mostrarse el aviso redundante");
assert.ok(staticHtml.includes("fetch('./data/draws.json'"), "La web debe cargar el histórico oficial");
assert.deepEqual(publicArchive, sourceArchive, "El histórico público debe coincidir con el histórico validado");
assert.ok(publicArchive.draws.length > 0, "El histórico oficial debe conservarse");

if (sourceArchive.draws.length > 7) {
  const fixedReport = JSON.parse(await readFile(resolve(projectRoot, "public/data/ai-analysis-7.json"), "utf8"));
  assert.equal(fixedReport.version, "4.0.0");
  assert.equal(fixedReport.window, 7);
  assert.equal(fixedReport.status, "ready");
  assert.equal(fixedReport.drawCount, sourceArchive.draws.filter(draw => draw.date >= "2026-01-01").length);
  assert.equal(fixedReport.sourceLastDate, sourceArchive.latestDate);
  assert.equal(fixedReport.audit.simulations, fixedReport.metrics.simulations);
  assert.ok(fixedReport.audit.bootstrapReplicates >= 1000);
  assert.equal(fixedReport.audit.ci95MeanHits.length, 2);
  assert.ok(Number.isFinite(fixedReport.audit.meanHits));
  assert.ok(Number.isFinite(fixedReport.audit.randomBaseline.meanHits));
  assert.ok(Number.isFinite(fixedReport.audit.deltaVsRandom));
  assert.ok(Number.isFinite(fixedReport.metrics.recent100.threePlusRate));
  assert.ok(Array.isArray(fixedReport.forecast.recentSignals));
  assert.deepEqual(fixedReport.methods, ["Parejas habituales"]);
  assert.equal(fixedReport.objective.pairHistoryStart, "2026-01-01");
  assert.equal(fixedReport.forecast.sharedNumbers <= 3, true);
  assert.equal(fixedReport.forecast.pairHistoryStart, "2026-01-01");
  assert.equal(fixedReport.objective.predictionStrategy, "highest-sum-of-pair-frequencies");
  assert.equal(fixedReport.forecast.numbers.length, 6);
  assert.equal(fixedReport.forecast.alternatives.length, 6);
  assert.ok(fixedReport.forecast.numbers.filter(n => fixedReport.forecast.alternatives.includes(n)).length <= 3);
  assert.equal(fixedReport.forecast.alternativeSelectionReasons.length, 6);
  assert.ok(Number.isFinite(fixedReport.metrics.alternative.meanHits));
  assert.ok(Number.isFinite(fixedReport.audit.alternative.meanHits));
  assert.equal(fixedReport.audit.alternative.ci95MeanHits.length, 2);
  assert.ok(staticHtml.includes("Combinación 1") && staticHtml.includes("Combinación 2"));
  assert.ok(!("randomMeanHits" in fixedReport.metrics));
  assert.ok(!("deltaVsRandom" in fixedReport.experts[0]));
  assert.ok("randomBaseline" in fixedReport.audit);
  assert.ok(!("windowStudy" in fixedReport));
  assert.ok(fixedReport.forecast.numbers.length === 6);
  assert.ok(!staticHtml.includes("repeatTrials"));
  assert.ok(!staticHtml.includes("repeatRates"));
} else {
  await assert.rejects(readFile(resolve(projectRoot, "public/data/ai-analysis-7.json"), "utf8"));
}
console.log("Artefacto estático válido: histórico oficial y Laboratorio IA disponibles.");
