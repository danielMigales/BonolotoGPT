import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

// Validate that the static UI's choices have matching, freshly generated reports.
const staticHtml = await readFile(resolve(projectRoot, "public/index.html"), "utf8");
const staticIcon = await readFile(resolve(projectRoot, "public/icon.svg"), "utf8");
const archive = JSON.parse(await readFile(resolve(projectRoot, "data/draws.json"), "utf8"));
assert.match(staticHtml, /rel="icon" type="image\/svg\+xml" href="\.\/icon\.svg"/);
assert.match(staticHtml, /<img src="\.\/icon\.svg" alt="">/);
assert.match(staticHtml, /La actualización depende de la sincronización del histórico/);
assert.doesNotMatch(staticHtml, /SELAE se consulta cada hora|tarea programada consulta SELAE cada hora/);
assert.ok(staticHtml.includes("fetch('./data/draws.json'"), 'La web estática debe cargar el histórico versionado');
assert.ok(staticHtml.includes("fetch('./data/ai-analysis-'+window+'.json'"), 'La web estática debe cargar el informe fijo de 15 sorteos');
assert.match(staticHtml, /Ventana de análisis[\s\S]*?15 sorteos/);
assert.doesNotMatch(staticHtml, /id="ai-window"|Número de sorteos|<option value="(?:5|10|15|20|30|50)">/);
assert.doesNotMatch(staticHtml, /fetch\(['"]\/api\/(?:draws|ai)/, 'La web estática no debe depender de rutas API del Worker');
assert.match(source, /url\.pathname===\x27\/icon\.svg\x27/);
assert.match(staticIcon, /<svg[\s>]/);
const fixedReport = JSON.parse(await readFile(resolve(projectRoot, "public/data/ai-analysis-15.json"), "utf8"));
assert.equal(fixedReport.window, 15);
assert.equal(fixedReport.status, "ready");
assert.equal(fixedReport.drawCount, archive.draws.length);
assert.equal(fixedReport.sourceLastDate, archive.latestDate);
for (const obsoleteWindow of [5, 10, 20, 30, 50]) {
  await assert.rejects(readFile(resolve(projectRoot, `public/data/ai-analysis-${obsoleteWindow}.json`), "utf8"));
}
const defaultReport = JSON.parse(await readFile(resolve(projectRoot, "data/ai-analysis.json"), "utf8"));
const defaultModel = JSON.parse(await readFile(resolve(projectRoot, "data/ai-model.json"), "utf8"));
assert.equal(defaultReport.window, 15);
assert.equal(defaultReport.status, "ready");
assert.equal(defaultReport.drawCount, archive.draws.length);
assert.equal(defaultReport.sourceLastDate, archive.latestDate);
assert.equal(defaultModel.window, 15);
assert.equal(defaultModel.version, defaultReport.modelState.version);

console.log("Artifact is valid ESM, exports default.fetch, and contains consistent AI reports");
