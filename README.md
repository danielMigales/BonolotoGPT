# BonolotoGPT · Archivo de sorteos

Aplicación web en español para consultar los últimos sorteos de Bonoloto y el histórico normalizado desde el 1 de enero de 2026.

## Funciones

- Consulta de los últimos resultados y del histórico por fechas.
- Complementario y reintegro cuando constan en el resultado.
- Laboratorio experimental con dos combinaciones de seis números: los seis primeros del ranking y los seis siguientes.
- Backtesting cronológico descriptivo y auditoría frente a una referencia aleatoria teórica.
- Actualización y validación del histórico con fuentes de SELAE.

## Método del laboratorio

El laboratorio utiliza **parejas habituales** con el histórico completo desde el **1 de enero de 2026**. Para cada combinación de seis números se suman las frecuencias de sus 15 parejas posibles. No se pondera la antigüedad: cada sorteo del periodo aporta una unidad a cada pareja que contiene.

La primera combinación es la que obtiene la mayor puntuación total. La segunda aplica exactamente el mismo criterio, con un máximo de tres números compartidos con la primera. La interfaz muestra las parejas y sus frecuencias para justificar ambas selecciones.

El backtest es cronológico: cada predicción usa únicamente sorteos anteriores al que evalúa. Por el coste de la búsqueda exhaustiva, el informe público evalúa las cinco predicciones cronológicas más recientes disponibles; las parejas de la propuesta sí se calculan con todos los sorteos del periodo. Sus resultados son descriptivos y no garantizan premios ni demuestran capacidad predictiva.

## Archivos principales

- `data/draws.json`: histórico normalizado de sorteos.
- `web/index.html`: interfaz fuente.
- `web/logic.js`: lógica de consulta y presentación del histórico.
- `engine/model.js`: motor de parejas habituales.
- `scripts/update_data.py`: descarga y validación del histórico.
- `scripts/build.mjs`: generación del sitio estático y del informe del laboratorio.
- `public/`: sitio estático publicado.

## Ejecución local

Requiere Node.js 22+ y Python 3.12+. Ejecuta `python scripts/update_data.py`, `npm test`, `npm run build` y `python -m http.server 8000 --directory public`. Abre http://localhost:8000.

## Publicación

Repositorio: https://github.com/danielMigales/BonolotoGPT

GitHub Actions ejecuta las pruebas, construye la aplicación y publica `public/` en GitHub Pages. La actualización automática del histórico depende de que la descarga y validación de los resultados finalice correctamente.

Nunca se inventan resultados ni se rellenan datos ausentes con ejemplos.
