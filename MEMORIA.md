# Memoria técnica — BonolotoGPT
Última revisión: 19 de octubre de 2026.

## Propósito
BonolotoGPT es una aplicación independiente para consultar el histórico oficial de Bonoloto y analizar combinaciones de seis números. La fuente de resultados es SELAE. No se inventan resultados y no se garantiza capacidad predictiva.

## Regla central
Cada sorteo se almacena como fecha, identificador oficial, URL oficial y los seis números principales. No se guardan campos auxiliares en el archivo normalizado. La interfaz, las estadísticas, las predicciones, las métricas y el seguimiento utilizan exclusivamente esos seis números.

## Modelo
- Versión: 2.1.0.
- Universo: números del 1 al 49; seis números distintos por combinación.
- La interfaz muestra los cinco sorteos más recientes y permite consultar el histórico.
- El Laboratorio IA usa una ventana fija de 15 sorteos y requiere 16 sorteos oficiales para evaluar la primera predicción.
- Siete métodos estadísticos se combinan y se evalúan secuencialmente usando exclusivamente los seis números principales.
- La evaluación registra aciertos de 0 a 6 y compara con una referencia aleatoria reproducible. No implica que el método supere al azar.

## Calendario
Bonoloto celebra sorteos de lunes a sábado. Los domingos no forman parte de la cobertura esperada. El siguiente sorteo se calcula a partir del último resultado oficial.

## Archivos fuente
- `data/draws.json`: histórico normalizado; actualmente vacío y pendiente de carga oficial.
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
El histórico normalizado del repositorio está vacío. No hay resultados oficiales cargados. Los informes antiguos se eliminan para que no se confundan con un análisis de Bonoloto. La publicación está pendiente hasta que GitHub Actions finalice con éxito.

## Verificaciones necesarias
1. `npm test`
2. `npm run build`
3. Confirmar que los archivos generados están sincronizados.
4. Confirmar que el workflow de publicación finaliza correctamente.
