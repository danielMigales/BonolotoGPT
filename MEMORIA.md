# Memoria técnica — BonolotoGPT
Última revisión: 25 de noviembre de 2026.

## Propósito
BonolotoGPT es una aplicación independiente para consultar el histórico oficial de Bonoloto y analizar combinaciones de seis números. La fuente de resultados es SELAE. No se inventan resultados.

## Regla central
Cada sorteo se almacena como fecha, identificador oficial, URL oficial y los seis números principales. No se guardan campos auxiliares en el archivo normalizado. La interfaz, las estadísticas, las predicciones, las métricas y el seguimiento utilizan exclusivamente esos seis números.

## Modelo publicado
- Versión del motor: 4.0.0.
- Universo: números del 1 al 49; seis números distintos por combinación.
- El Laboratorio utiliza parejas habituales calculadas sobre los siete sorteos más recientes disponibles.
- La puntuación es la suma de las frecuencias de las 15 parejas de cada combinación dentro de esa ventana.
- Se generan dos combinaciones; la segunda comparte como máximo tres números con la primera.
- La evaluación registra aciertos de 0 a 6 y utiliza ventanas cronológicas.

## Nueva especificación solicitada para el laboratorio — 25-11-2026
Pendiente de implementación y de cerrar la lista definitiva de métodos:

1. Siete pestañas independientes, una por método.
2. Dos combinaciones de seis números por pestaña.
3. Cada método calcula usando solo los diez sorteos más recientes del año en curso.
4. No utilizar sorteos de años anteriores ni completar con ellos una ventana incompleta.
5. Métodos citados expresamente por el propietario: Markov, recencia ponderada, Bayes y frecuencia acumulada.
6. El método actual de parejas habituales debe incluirse en el inventario para el nuevo laboratorio.
7. Identificar los métodos restantes en documentación y código y definir las siete fórmulas antes de programar.

Inventario encontrado hasta ahora: parejas habituales es el método actual; recencia ponderada exponencial existió en una versión anterior y utilizaba `0.5 ** (antigüedad / semivida)` con semivida predeterminada de ocho sorteos; frecuencia acumulada figura como estadística descriptiva; Markov y Bayes no se han encontrado como implementaciones previas. No afirmar que ya existen siete algoritmos documentados.

## Calendario
El calendario de fechas esperadas se define en `scripts/update_data.py` y en sus pruebas; debe mantenerse coherente con el calendario oficial vigente.

## Archivos fuente
- `data/draws.json`: histórico normalizado.
- `engine/model.js`: estadísticas, predicción y seguimiento de aciertos.
- `web/logic.js`: frecuencias y resumen de los seis números.
- `web/index.html`: interfaz fuente.
- `public/index.html` y `public/data/`: versión estática para GitHub Pages.
- `scripts/update_data.py`: descarga y validación de SELAE.
- `scripts/build.mjs`: genera el sitio estático y el análisis.

## Decisiones operativas del propietario
- Los resultados recientes que el propietario facilita manualmente cuando SELAE falla son válidos y fiables.
- La descarga automática falla repetidamente; no presentarla como funcional.
- El periodo de interés es desde el 1 de enero del año en curso, no desde 1988.
- Los errores del histórico no deben impedir que la web cargue.
- La APK fue una prueba descartada.
- No insistir en que el azar es mejor que el algoritmo.
- No cambiar decisiones ni ampliar el alcance por iniciativa propia.
- No añadir automatizaciones ni modificar workflows, histórico o flujo de actualización sin autorización expresa.

## Verificaciones necesarias
1. `npm test`
2. `npm run build`
3. Confirmar que los archivos generados están sincronizados.
4. Revisar GitHub Actions antes de declarar terminada una publicación.

## Regla de mantenimiento documental
Consultar la documentación antes de cada intervención. Registrar cada cambio autorizado en `HISTORIAL_TRABAJO.md` y actualizar en el mismo trabajo README, contexto e investigación cuando corresponda. Registrar decisiones, fórmulas, parámetros, archivos afectados, pruebas, limitaciones y pendientes.
