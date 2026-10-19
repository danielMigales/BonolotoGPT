# Sincronización oficial de BonolotoGPT

## Fuente y archivo
El objetivo principal es obtener los resultados de SELAE mediante `scripts/update_data.py`. El importador valida los seis números principales y guarda en `data/draws.json` únicamente identificador, fecha, seis números y enlace al resultado oficial. Si SELAE bloquea o no ofrece el dato, puede intentar fuentes auxiliares para recuperar la combinación; por ello el campo `importSource` documenta la procedencia real y la validación por frecuencias oficiales no equivale a una comprobación individual de cada sorteo. Los campos auxiliares nunca se usan en cálculos.

## Procedimiento local
Requiere Python 3.12+, Node.js 22+ y curl.

```sh
python scripts/update_data.py
npm test
npm run build
```

La actualización falla si no puede recuperar las fechas requeridas, si los números no son válidos, si existen fechas/identificadores duplicados o si el tramo de control no coincide con las frecuencias oficiales. No se inventan resultados. El histórico anterior se conserva ante un error de descarga.

## Calendario
Se esperan sorteos de lunes a sábado. Los domingos se excluyen de la cobertura prevista. Los resultados se consultan después de las 23:00, hora de Madrid, en la fecha de sorteo esperada.

## Almacenamiento del Worker
El histórico, los informes, los modelos y las propuestas se guardan bajo el prefijo `bonoloto/` en el bucket. Las claves antiguas sin ese prefijo no se consultan, para evitar mezclar datos de otra aplicación. Los registros de seguimiento conservan únicamente fecha, versión, seis números propuestos, seis números oficiales y número de aciertos.

## Publicación
GitHub Actions debe descargar y validar el histórico, ejecutar las pruebas, construir los artefactos y publicar `public/`. La publicación no se considera confirmada hasta que el workflow termina correctamente. La programación del workflow de publicación comprueba las 21:00 y 22:00 UTC y solo ejecuta la actualización a las 23:00 de Madrid. Una ejecución correcta de GitHub Actions es necesaria para confirmar cada actualización.
