# Memoria técnica — BonolotoGPT
Última revisión: 19 de octubre de 2026.

## Propósito
BonolotoGPT es una aplicación independiente para consultar el histórico oficial de Bonoloto y analizar combinaciones de seis números. La fuente de resultados es SELAE. No se inventan resultados y no se garantiza capacidad predictiva.

## Regla central
Cada sorteo se almacena como fecha, identificador oficial, URL oficial y los seis números principales. No se guardan campos auxiliares en el archivo normalizado. La interfaz, las estadísticas, las predicciones, las métricas y el seguimiento utilizan exclusivamente esos seis números.

## Modelo
- Versión del motor: 2.15.0.
- La aplicación genera y evalúa una única combinación de seis números.
- Universo: números del 1 al 49; seis números distintos por combinación.
- La interfaz muestra los cinco sorteos más recientes y permite consultar el histórico.
- El Laboratorio IA usa una ventana fija de 7 sorteos y requiere 8 sorteos oficiales para evaluar la primera predicción.
- Siete métodos estadísticos se combinan y se evalúan secuencialmente usando exclusivamente los seis números principales.
- La evaluación registra aciertos de 0 a 6 y compara con una referencia aleatoria reproducible. No implica que el método supere al azar.

## Calendario
El calendario de fechas esperadas se define en `scripts/update_data.py` y en sus pruebas; debe mantenerse coherente con el calendario oficial vigente. El siguiente sorteo se calcula a partir del último resultado oficial.

## Archivos fuente
- `data/draws.json`: histórico normalizado desde el 1 de enero de 2026.
- `engine/model.js`: estadísticas, predicción y seguimiento de aciertos.
- `web/logic.js`: frecuencias y resumen de los seis números.
- `web/index.html`: interfaz fuente.
- `public/index.html` y `public/data/`: versión estática para GitHub Pages.
- `scripts/update_data.py`: descarga y validación de SELAE; conserva seis números en el archivo normalizado.
- `scripts/build.mjs`: genera el sitio estático y el análisis.

## Estado
El repositorio contiene histórico y evaluación de predicciones de Bonoloto. La importación histórica combina el CSV auxiliar y consultas de resultados; el control de frecuencias SELAE es agregado y no equivale a verificar uno por uno todos los sorteos. La publicación más reciente debe confirmarse mediante el estado de GitHub Actions.

## Verificaciones necesarias
1. `npm test`
2. `npm run build`
3. Confirmar que los archivos generados están sincronizados.
4. Confirmar que el workflow de publicación finaliza correctamente.


## ACLARACIONES VIGENTES DEL PROPIETARIO — 24-11-2026
Estas aclaraciones sustituyen cualquier indicación contradictoria de las secciones antiguas de esta memoria:

- Los resultados recientes que el propietario facilita manualmente cuando SELAE falla son válidos y fiables. La descarga automática falla repetidamente; no presentarla como funcional.
- El modelo vigente utiliza **solo parejas habituales**: suma las frecuencias de las 15 parejas de cada combinación con todos los sorteos desde el **1 de enero de 2026**, sin ponderar antigüedad. La segunda combinación aplica el mismo criterio y comparte como máximo tres números con la primera. Esta decisión sustituye la recencia ponderada y la semivida 8.
- El periodo de interés es desde el **1 de enero del año en curso**, no desde 1988.
- Los errores del histórico no deben impedir que la web cargue.
- La APK fue una prueba descartada porque no se actualiza; no es una línea activa.
- No insistir en que el azar es mejor que el algoritmo.
- No cambiar decisiones ni ampliar el alcance por iniciativa propia. Verificar el contexto antes de llamar “fallo” a una decisión deliberada. No reabrir cuestiones ya resueltas salvo que el propietario lo solicite.

