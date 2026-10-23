# Sincronización y procedencia de datos de BonolotoGPT

## Fuente y archivo

El importador `scripts/update_data.py` intenta obtener los resultados de SELAE. Valida los seis números principales y guarda en `data/draws.json` únicamente identificador, fecha, seis números y enlace a la página de resultados de SELAE. Si SELAE bloquea la petición o no ofrece el dato, puede recurrir a fuentes auxiliares para recuperar la combinación.

El campo `source` es el enlace de la página oficial de resultados correspondiente a la fecha; no es una prueba de que la combinación se haya descargado o contrastado individualmente con SELAE. El campo `importSource` documenta la fuente usada para la importación masiva y/o para complementar fechas recientes. La comparación de frecuencias con estadísticas oficiales de SELAE es un control agregado del tramo histórico, no una certificación individual de todos los sorteos. Los campos auxiliares nunca se usan en los cálculos del modelo.

## Procedimiento local

Requiere Python 3.12+, Node.js 22+ y curl.

```sh
python scripts/update_data.py
npm test
npm run build
```

La actualización falla si no puede recuperar las fechas requeridas, si los números no son válidos, si existen fechas/identificadores duplicados o si el tramo de control no coincide con las frecuencias oficiales. No se inventan resultados. El histórico anterior se conserva ante un error de descarga; los datos parciales de recuperación se guardan por separado para permitir reintentos.

## Calendario

Bonoloto tiene sorteos todos los días de la semana, incluidos los domingos. El importador comprueba la cobertura diaria desde el **1 de enero de 2026** hasta la última fecha prevista que ya debería tener resultado. Los resultados se consultan después de las 23:00, hora de Madrid; antes de esa hora se considera que el resultado del día actual aún puede no estar disponible. Si el histórico ya alcanza la última fecha prevista, el proceso no necesita volver a descargarla.

## Almacenamiento y publicación

Los datos históricos, el informe del laboratorio y el seguimiento prospectivo se guardan como archivos versionados en el repositorio. GitHub Actions los actualiza, valida y publica como archivos estáticos en GitHub Pages; la aplicación no necesita un servidor, Worker ni bucket externo.

## Publicación

GitHub Actions descarga y valida el histórico, ejecuta las pruebas, construye los archivos y publica `public/`. La publicación no se considera confirmada hasta que el workflow termina correctamente. La programación del workflow comprueba los horarios correspondientes a las 23:00 de Madrid (21:00 UTC durante el horario de verano y 22:00 UTC durante el horario de invierno). Una ejecución correcta de GitHub Actions es necesaria para confirmar cada actualización.
