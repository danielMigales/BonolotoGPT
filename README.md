# BonolotoGPT · Archivo de sorteos

Aplicación web en español para consultar los últimos sorteos de Bonoloto y el histórico oficial guardado desde el 1 de enero de 2026.

## Funciones

- Laboratorio IA con una propuesta experimental de seis números y explicación de las señales utilizadas.
- Backtesting secuencial descriptivo e intervalos bootstrap por bloques temporales.
- Estudio descriptivo de ventanas analíticas de 5, 7, 10, 15, 20, 30 y 50 sorteos.

El laboratorio conserva siete métodos: frecuencia acumulada, frecuencia reciente, recencia ponderada, repetición y rachas recientes, parejas y estructura, Bayes Beta-Binomial y Markov regularizado. La selección explora combinaciones entre los catorce candidatos mejor puntuados y pondera suavemente la coaparición histórica de parejas. La evaluación prioriza el recuento de combinaciones con 3+ aciertos y muestra resultados en ventanas recientes de 50 y 100 predicciones. Estas señales son experimentales: el histórico no demuestra una ventaja predictiva ni garantiza premios.

## Funciones activas

- Consulta de los últimos resultados oficiales.
- Consulta del histórico por fechas.
- Recuento y marcadores de números repetidos en los sorteos mostrados.
- Complementario y reintegro cuando constan en el resultado.
- Introducción controlada de un sorteo pendiente y actualización del histórico.
- Enlaces a la fuente oficial de SELAE.

## Sobre las predicciones

El laboratorio está disponible como herramienta experimental y presenta sus límites estadísticos de forma explícita. El backtest es descriptivo y no compara con combinaciones aleatorias ni demuestra capacidad predictiva; sus combinaciones no deben interpretarse como predicciones fiables.

El motor experimental se conserva en `engine/`; sus seis métodos se evalúan retrospectivamente mediante aciertos e intervalos bootstrap descriptivos. La propuesta selecciona directamente los seis números mejor clasificados, sin búsqueda combinatoria.

La Bonoloto es un sorteo aleatorio: los resultados pasados no permiten garantizar ni demostrar una ventaja para el siguiente sorteo.

## Archivos principales

- `data/draws.json`: histórico normalizado de sorteos.
- `web/index.html`: interfaz fuente.
- `web/logic.js`: lógica de consulta y presentación del histórico.
- `public/`: sitio estático publicado.
- `scripts/update_data.py`: descarga y validación del histórico.
- `scripts/build.mjs`: generación del sitio estático con el informe del laboratorio.

## Ejecución local

Requiere Node.js 22+ y Python 3.12+. Ejecuta `python scripts/update_data.py`, `npm test`, `npm run build` y `python -m http.server 8000 --directory public`. Abre http://localhost:8000.

## Publicación

Repositorio: https://github.com/danielMigales/BonolotoGPT

GitHub Actions valida el histórico, ejecuta las pruebas, construye la aplicación y publica `public/` en GitHub Pages. La actualización automática depende de que la descarga y validación del histórico finalice correctamente.

Nunca se inventan resultados ni se rellenan datos ausentes con ejemplos.
