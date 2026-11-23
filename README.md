# BonolotoGPT · Archivo de sorteos

Aplicación web en español para consultar los últimos sorteos de Bonoloto y el histórico normalizado desde el 1 de enero de 2026.

## Funciones

- Consulta de los últimos resultados y del histórico por fechas.
- Complementario y reintegro cuando constan en el resultado.
- Laboratorio experimental con dos combinaciones de seis números: los seis primeros del ranking y los seis siguientes.
- Backtesting cronológico descriptivo y auditoría frente a una referencia aleatoria teórica.
- Actualización y validación del histórico con fuentes de SELAE.

## Método del laboratorio

El laboratorio utiliza **un único método predictivo: recencia ponderada exponencial**, con una **semivida fija de 8 sorteos**. Cada aparición aporta la mitad de su peso al alcanzar ocho sorteos de antigüedad. No se combinan frecuencias acumuladas, parejas, Bayes, Markov ni otros modelos.

La primera combinación contiene los seis números con mayor puntuación; la segunda contiene los seis siguientes. Las métricas retrospectivas son descriptivas: no demuestran una ventaja predictiva ni garantizan premios.

La Bonoloto es un sorteo aleatorio. Los resultados pasados no permiten garantizar ni demostrar una ventaja para el siguiente sorteo.

## Archivos principales

- `data/draws.json`: histórico normalizado de sorteos.
- `web/index.html`: interfaz fuente.
- `web/logic.js`: lógica de consulta y presentación del histórico.
- `engine/model.js`: motor de recencia ponderada.
- `scripts/update_data.py`: descarga y validación del histórico.
- `scripts/build.mjs`: generación del sitio estático y del informe del laboratorio.
- `public/`: sitio estático publicado.

## Ejecución local

Requiere Node.js 22+ y Python 3.12+. Ejecuta `python scripts/update_data.py`, `npm test`, `npm run build` y `python -m http.server 8000 --directory public`. Abre http://localhost:8000.

## Publicación

Repositorio: https://github.com/danielMigales/BonolotoGPT

GitHub Actions ejecuta las pruebas, construye la aplicación y publica `public/` en GitHub Pages. La actualización automática del histórico depende de que la descarga y validación de los resultados finalice correctamente.

Nunca se inventan resultados ni se rellenan datos ausentes con ejemplos.
