# Sincronización oficial de BonolotoGPT

## Fuente y archivo
Los datos se obtienen de SELAE mediante `scripts/update_data.py`. El importador acepta únicamente registros con `game_id=BONO`, valida los seis números principales y el calendario, y guarda en `data/draws.json` solo el identificador, la fecha, los seis números y la URL oficial. Los campos auxiliares de la respuesta de SELAE no se almacenan en el histórico normalizado ni se usan en cálculos.

## Procedimiento local
Requiere Python 3.12+, Node.js 22+ y curl.

```sh
python scripts/update_data.py
npm test
npm run build
```

La actualización falla si SELAE no devuelve datos válidos, si faltan fechas esperadas o si hay identificadores duplicados. No se inventan resultados ni se publica un archivo incompleto. El histórico anterior se conserva ante un error de descarga.

## Calendario
Se esperan sorteos de lunes a sábado. Los domingos se excluyen de la cobertura prevista. Los resultados se consultan después de las 23:00, hora de Madrid, en la fecha de sorteo esperada.

## Almacenamiento del Worker
El histórico, los informes, los modelos y las propuestas se guardan bajo el prefijo `bonoloto/` en el bucket. Las claves antiguas sin ese prefijo no se consultan, para evitar mezclar datos de otra aplicación. Los registros de seguimiento conservan únicamente fecha, versión, seis números propuestos, seis números oficiales y número de aciertos.

## Publicación
GitHub Actions debe descargar y validar el histórico, ejecutar las pruebas, construir los artefactos y publicar `public/`. La publicación no se considera confirmada hasta que el workflow termina correctamente. No se debe afirmar que existe una actualización automática programada sin verificarla.
