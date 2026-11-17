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
assert.ok(staticHtml.includes("Histórico de resultados"));
assert.ok(staticHtml.includes("fetch('./data/draws.json'"), "La web debe cargar el histórico oficial");
for (const marker of ["Laboratorio IA", "Predicción y análisis", "ai-analysis", "ai-forecast", "view-ai"]) {
  assert.ok(!staticHtml.includes(marker), "La web publicada no debe incluir: " + marker);
}
assert.ok(!staticHtml.includes("MANUAL · NO VERIFICADO"));
assert.ok(!staticHtml.includes('href="' + "$" + '{d.source}"'));
assert.ok(!staticHtml.includes("fetch('/api/draws"));
assert.deepEqual(publicArchive, sourceArchive, "El histórico público debe coincidir con el histórico validado");
assert.ok(publicArchive.draws.length > 0, "El histórico oficial debe conservarse");
for (const report of ["ai-analysis-5.json","ai-analysis-7.json","ai-analysis-10.json","ai-analysis-15.json","ai-analysis-20.json","ai-analysis-30.json","ai-analysis-50.json"]) {
  await assert.rejects(readFile(resolve(projectRoot, "public/data", report), "utf8"));
}
for (const report of ["ai-analysis.json","ai-model.json"]) {
  await assert.rejects(readFile(resolve(projectRoot, "data", report), "utf8"));
}
console.log("Artefacto estático válido: histórico oficial disponible y laboratorio/predicciones ausentes.");
