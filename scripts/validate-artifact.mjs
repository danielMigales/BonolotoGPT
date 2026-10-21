import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const staticHtml = await readFile(resolve(projectRoot, "public/index.html"), "utf8");
const staticIcon = await readFile(resolve(projectRoot, "public/icon.svg"), "utf8");
const archive = JSON.parse(await readFile(resolve(projectRoot, "data/draws.json"), "utf8"));

// Validate that the static UI's choices have matching, freshly generated reports.
assert.match(staticHtml, /rel="icon" type="image\/svg\+xml" href="\.\/icon\.svg"/);
assert.match(staticHtml, /<img src="\.\/icon\.svg" alt="">/);
assert.match(staticHtml, /La actualización puede no ser inmediata/);
assert.match(staticHtml, /no una prueba de la fuente de importación individual/);
assert.doesNotMatch(staticHtml, /SELAE se consulta cada hora|tarea programada consulta SELAE cada hora/);
assert.ok(staticHtml.includes("fetch('./data/draws.json'"), 'La web estática debe cargar el histórico versionado');
assert.ok(staticHtml.includes("fetch('./data/ai-analysis-'+window+'.json'"), 'La web estática debe cargar el informe fijo de 7 sorteos');
assert.match(staticHtml, /Ventana de análisis[\s\S]*?7 sorteos/);
assert.match(staticHtml, /Ventana reciente fija de 7 sorteos; aprendizaje y evaluación sobre el histórico disponible/);
assert.doesNotMatch(staticHtml, /id="ai-window"|Número de sorteos|<option value="(?:5|10|15|20|30|50)">/);
assert.doesNotMatch(staticHtml, /fetch\(['"]\/api\/(?:draws|ai)/, 'La web estática no debe depender de rutas API del Worker');
assert.match(staticIcon, /<svg[\s>]/);
if (archive.draws.length > 7) {
  const fixedReport = JSON.parse(await readFile(resolve(projectRoot, "public/data/ai-analysis-7.json"), "utf8"));
  assert.equal(fixedReport.window, 7);
  assert.equal(fixedReport.audit.simulations, fixedReport.metrics.simulations);
  assert.ok(fixedReport.audit.randomTrialsPerDraw >= 100);
  assert.ok(fixedReport.audit.nullReplicates >= 1000);
  assert.equal(fixedReport.audit.ci95Delta.length, 2);
  assert.ok(Number.isFinite(fixedReport.audit.pValueOneSided));
  assert.equal(fixedReport.status, "ready");
  assert.equal(fixedReport.drawCount, archive.draws.length);
  assert.equal(fixedReport.sourceLastDate, archive.latestDate);
  for (const obsoleteWindow of [5, 10, 15, 20, 30, 50]) {
    await assert.rejects(readFile(resolve(projectRoot, `public/data/ai-analysis-${obsoleteWindow}.json`), "utf8"));
  }
  const defaultReport = JSON.parse(await readFile(resolve(projectRoot, "data/ai-analysis.json"), "utf8"));
  const defaultModel = JSON.parse(await readFile(resolve(projectRoot, "data/ai-model.json"), "utf8"));
  assert.equal(defaultReport.window, 7);
  assert.equal(defaultReport.status, "ready");
  assert.equal(defaultReport.drawCount, archive.draws.length);
  assert.equal(defaultReport.sourceLastDate, archive.latestDate);
  assert.equal(defaultModel.window, 7);
  assert.equal(defaultModel.version, defaultReport.modelState.version);
} else {
  await assert.rejects(readFile(resolve(projectRoot, "public/data/ai-analysis-7.json"), "utf8"));
  await assert.rejects(readFile(resolve(projectRoot, "data/ai-analysis.json"), "utf8"));
  await assert.rejects(readFile(resolve(projectRoot, "data/ai-model.json"), "utf8"));
}

console.log("Static Pages artifact and AI reports are valid");
