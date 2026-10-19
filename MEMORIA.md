# Memoria técnica — BonolotoGPT
Última revisión: 19 de octubre de 2026.

## Propósito
BonolotoGPT es una aplicación independiente para consultar el histórico oficial de Bonoloto y analizar combinaciones de seis números. La fuente de resultados es SELAE. No se inventan resultados y no se garantiza capacidad predictiva.

## Regla central
Cada sorteo se almacena como fecha, identificador oficial, URL oficial y los seis números principales. No se guardan campos auxiliares en el archivo normalizado. La interfaz, las estadísticas, las predicciones, las métricas y el seguimiento utilizan exclusivamente esos seis números.

## Modelo
- Versión del motor: 2.2.0.
- Universo: números del 1 al 49; seis números distintos por combinación.
- La interfaz muestra los cinco sorteos más recientes y permite consultar el histórico.
- El Laboratorio IA usa una ventana fija de 15 sorteos y requiere 16 sorteos oficiales para evaluar la primera predicción.
- Siete métodos estadísticos se combinan y se evalúan secuencialmente usando exclusivamente los seis números principales.
- La evaluación registra aciertos de 0 a 6 y compara con una referencia aleatoria reproducible. No implica que el método supere al azar.

## Calendario
El calendario de fechas esperadas se define en `scripts/update_data.py` y en sus pruebas; debe mantenerse coherente con el calendario oficial vigente. El siguiente sorteo se calcula a partir del último resultado oficial.

## Archivos fuente
- `data/draws.json`: histórico normalizado desde el 1 de enero de 2026.
- `engine/model.js`: estadísticas, predicción y seguimiento de aciertos.
- `web/logic.js`: frecuencias y resumen de los seis números.
- `web/index.html`: interfaz fuente.
- `worker/template.js`: validación, endpoints y persistencia.
- `worker/index.js`: Worker generado.
- `public/index.html` y `public/data/`: versión estática para GitHub Pages.
- `scripts/update_data.py`: descarga y validación de SELAE; conserva seis números en el archivo normalizado.
- `scripts/build.mjs`: genera Worker y sitio estático.

## Aislamiento de almacenamiento
El Worker usa el espacio de claves `bonoloto/` para el histórico, informes, modelos y seguimiento. No lee claves heredadas sin ese prefijo. Si encuentra datos que no parecen corresponder a Bonoloto, los aísla y muestra un aviso hasta recibir datos oficiales válidos.

## Estado
El repositorio contiene histórico y evaluación de predicciones de Bonoloto. La importación histórica combina el CSV auxiliar y consultas de resultados; el control de frecuencias SELAE es agregado y no equivale a verificar uno por uno todos los sorteos. La publicación más reciente debe confirmarse mediante el estado de GitHub Actions.

## Verificaciones necesarias
1. `npm test`
2. `npm run build`
3. Confirmar que los archivos generados están sincronizados.
4. Confirmar que el workflow de publicación finaliza correctamente.
