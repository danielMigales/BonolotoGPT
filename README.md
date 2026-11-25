# BonolotoGPT · Archivo de sorteos

Aplicación web en español para consultar los últimos sorteos de Bonoloto y el histórico normalizado desde el 1 de enero de 2026.

## Funciones

- Consulta de los últimos resultados y del histórico por fechas.
- Complementario y reintegro cuando constan en el resultado.
- Laboratorio experimental con dos combinaciones de seis números: los seis primeros del ranking y los seis siguientes.
- Backtesting cronológico descriptivo y auditoría frente a una referencia aleatoria teórica.
- Actualización y validación del histórico con fuentes de SELAE.

## Método del laboratorio actualmente publicado

El laboratorio utiliza **parejas habituales** calculadas exclusivamente con los **últimos 7 sorteos disponibles**. Para cada combinación de seis números se suman las frecuencias de sus 15 parejas posibles dentro de esa ventana. Los sorteos anteriores no intervienen en la puntuación de la combinación actual.

La primera combinación es la que obtiene la mayor puntuación total. La segunda aplica exactamente el mismo criterio, con un máximo de tres números compartidos con la primera. La interfaz muestra las parejas y sus frecuencias para justificar ambas selecciones.

El backtest es cronológico: cada predicción usa únicamente los 7 sorteos anteriores más recientes al que evalúa. Por el coste de la búsqueda exhaustiva, el informe público evalúa las cinco predicciones cronológicas más recientes disponibles. Sus resultados son descriptivos y no garantizan premios ni demuestran capacidad predictiva.

## Nueva especificación solicitada para el laboratorio — 25-11-2026

Esta especificación describe el siguiente cambio pedido por el propietario. **Todavía no está implementada ni sustituye al funcionamiento publicado de siete sorteos y parejas habituales.**

- Crear **siete pestañas independientes**, una por método.
- Cada pestaña debe generar **dos combinaciones** de seis números.
- La ventana de análisis será exclusivamente la de los **diez sorteos más recientes del año en curso**.
- No utilizar sorteos de años anteriores, ni siquiera para completar diez observaciones.
- El propietario ha nombrado expresamente cuatro métodos: **Markov, recencia ponderada, Bayes y frecuencia acumulada**.
- El método actual de **parejas habituales** también debe contemplarse en el nuevo laboratorio.
- La revisión documental y del código realizada hasta ahora no acredita que existan siete métodos predictivos independientes ya implementados. Markov y Bayes no se encontraron como implementaciones anteriores; frecuencia acumulada aparecía como estadística descriptiva; recencia ponderada existió en una versión anterior; parejas habituales es el método actual.
- La lista definitiva de siete métodos y sus fórmulas sigue pendiente de identificar y documentar. No presentar una propuesta del asistente como decisión confirmada del propietario ni inventar métodos supuestamente existentes.

## Regla de mantenimiento documental

Consultar la documentación antes de modificar código. Registrar cada cambio autorizado en `HISTORIAL_TRABAJO.md` y actualizar en el mismo trabajo los documentos técnicos afectados. Anotar decisiones, fórmulas, parámetros, archivos modificados, pruebas, limitaciones, pendientes y decisiones descartadas. No dejar cambios de comportamiento sin documentar.

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
