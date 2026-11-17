# BonolotoGPT · Archivo de sorteos

Aplicación web en español para consultar los últimos sorteos de Bonoloto y el histórico oficial guardado desde el 1 de enero de 2026.

## Funciones activas

- Consulta de los últimos resultados oficiales.
- Consulta del histórico por fechas.
- Recuento y marcadores de números repetidos en los sorteos mostrados.
- Complementario y reintegro cuando constan en el resultado.
- Introducción controlada de un sorteo pendiente y actualización del histórico.
- Enlaces a la fuente oficial de SELAE.

## Sobre las predicciones

Se ha retirado de la aplicación el laboratorio y la generación/publicación de predicciones. Las pruebas realizadas no demostraron una ventaja estadísticamente significativa frente a una selección aleatoria, por lo que no se presentan combinaciones como si tuvieran capacidad predictiva.

El código experimental del motor se conserva en `engine/` y sus pruebas en `tests/model.test.mjs` como archivo técnico reversible, pero ya no forma parte de la aplicación publicada ni del proceso de construcción. Los informes y estados generados del modelo se eliminan.

La Bonoloto es un sorteo aleatorio: los resultados pasados no permiten garantizar ni demostrar una ventaja para el siguiente sorteo.

## Archivos principales

- `data/draws.json`: histórico normalizado de sorteos.
- `web/index.html`: interfaz fuente.
- `web/logic.js`: lógica de consulta y presentación del histórico.
- `public/`: sitio estático publicado.
- `scripts/update_data.py`: descarga y validación del histórico.
- `scripts/build.mjs`: generación del sitio estático sin predicciones.

## Ejecución local

Requiere Node.js 22+ y Python 3.12+. Ejecuta `python scripts/update_data.py`, `npm test`, `npm run build` y `python -m http.server 8000 --directory public`. Abre http://localhost:8000.

## Publicación

Repositorio: https://github.com/danielMigales/BonolotoGPT

GitHub Actions valida el histórico, ejecuta las pruebas, construye la aplicación y publica `public/` en GitHub Pages. La actualización automática depende de que la descarga y validación del histórico finalice correctamente.

Nunca se inventan resultados ni se rellenan datos ausentes con ejemplos.
