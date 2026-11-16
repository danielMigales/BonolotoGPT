# BonolotoGPT · Archivo y análisis de Bonoloto

Aplicación web en español para consultar los últimos siete sorteos, el histórico desde el 1 de enero de 2026 y un laboratorio de análisis estadístico.

## Funciones

- Consulta de resultados e histórico por fechas.
- Recuento de frecuencias, repeticiones, parejas, distancias y distribución de pares/impares.
- Una propuesta experimental de seis números, explicada con sus puntuaciones y señales históricas.
- Backtesting secuencial sin utilizar resultados futuros.
- Comparación con controles aleatorios, intervalos de confianza y valor p.
- Versión estática para GitHub Pages.

La Bonoloto es aleatoria. Los patrones pasados no garantizan premios ni una ventaja frente al azar.

## Archivos principales

- `engine/model.js`: motor estadístico y backtesting.
- `web/logic.js`: frecuencias y resumen de aciertos.
- `web/index.html`: interfaz fuente.
- `public/index.html`: interfaz estática generada.
- `data/draws.json`: histórico normalizado.
- `scripts/update_data.py`: descarga y validación del histórico.
- `scripts/build.mjs`: generación del sitio y los informes.

El campo `source` de cada fila enlaza a la página de resultados de SELAE, pero no demuestra por sí solo que esa fila se haya descargado o contrastado individualmente con SELAE. El importador contrasta también frecuencias agregadas; ese control no certifica cada combinación individual.

## Ejecución local

Requiere Node.js 22+ y Python 3.12+. Ejecuta `python scripts/update_data.py`, `npm test`, `npm run build` y `python -m http.server 8000 --directory public`. Abre http://localhost:8000.

## Publicación

Repositorio: https://github.com/danielMigales/BonolotoGPT

GitHub Actions valida los datos, ejecuta las pruebas, construye la aplicación y publica `public/` en GitHub Pages. La actualización automática depende de que la descarga y validación del histórico finalice correctamente.

Nunca se inventan resultados ni se rellenan datos ausentes con ejemplos.
