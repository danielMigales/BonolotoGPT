# Memoria técnica — BonolotoGPT
Última revisión: 25 de noviembre de 2026.

## Propósito
BonolotoGPT es una aplicación independiente para consultar el histórico de Bonoloto y analizar combinaciones de seis números. La fuente de resultados es SELAE. No se inventan resultados y no se garantiza capacidad predictiva.

## Regla central
Cada sorteo se almacena como fecha, identificador oficial, URL oficial y los seis números principales. No se guardan campos auxiliares en el archivo normalizado. La interfaz, las estadísticas, las predicciones, las métricas y el seguimiento utilizan exclusivamente esos seis números.

## Modelo activo actualmente
- Versión del motor: 4.0.0.
- La aplicación genera y evalúa dos combinaciones de seis números, con un máximo de tres números compartidos.
- Universo: números del 1 al 49; seis números distintos por combinación.
- El método activo suma las frecuencias de las 15 parejas de cada combinación con los sorteos desde el 1 de enero de 2026, sin ponderar antigüedad.
- La evaluación registra aciertos de 0 a 6 y compara con una referencia aleatoria reproducible.

## Especificación solicitada para la siguiente versión del laboratorio — 25-11-2026
Pendiente de implementación y de cerrar la lista definitiva de métodos:

1. Siete pestañas independientes, una por método.
2. Dos combinaciones de seis números por pestaña.
3. Cada método calcula usando solo los diez sorteos más recientes del año en curso.
4. No usar sorteos de años anteriores ni completar con ellos una ventana incompleta.
5. Métodos expresamente citados por el propietario: Markov, recencia ponderada, Bayes y frecuencia acumulada.
6. El método de parejas habituales, actualmente activo, forma parte de la revisión para las pestañas.

La inspección documental y del código disponible no encontró Markov ni Bayes implementados como algoritmos anteriores. La frecuencia acumulada aparecía como estadística descriptiva, no como predictor independiente. No afirmar que ya existen siete métodos documentados. Identificar los métodos restantes en el código/documentación y definir sus fórmulas antes de programar.

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

## Estado operativo y decisiones del propietario
- Los resultados recientes que el propietario facilita manualmente cuando SELAE falla son válidos y fiables. La descarga automática falla repetidamente; no presentarla como funcional.
- El periodo de interés es desde el 1 de enero del año en curso, no desde 1988.
- Los errores del histórico no deben impedir que la web cargue.
- La APK fue una prueba descartada porque no se actualiza; no es una línea activa.
- No insistir en que el azar es mejor que el algoritmo.
- No cambiar decisiones ni ampliar el alcance por iniciativa propia.
- No añadir automatizaciones ni modificar workflows, histórico o flujo de actualización sin autorización expresa.

## Verificaciones necesarias
1. `npm test`
2. `npm run build`
3. Confirmar que los archivos generados están sincronizados.
4. Confirmar el estado de GitHub Actions antes de declarar terminada una publicación.

## Regla de mantenimiento documental
Consultar esta memoria y el resto de la documentación antes de cada intervención. Anotar cada cambio autorizado en `HISTORIAL_TRABAJO.md` y actualizar en el mismo trabajo README, contexto e investigación cuando corresponda. Registrar decisiones, fórmulas, parámetros, archivos afectados, pruebas, limitaciones y pendientes. No dejar cambios de comportamiento sin documentar.
