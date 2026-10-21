# BonolotoGPT · Archivo y análisis de Bonoloto

Aplicación web en español para consultar los últimos cinco sorteos de Bonoloto, el histórico oficial desde el **1 de enero de 2026** y un laboratorio experimental de análisis.

## Qué hace

- Muestra exclusivamente los **seis números principales** de cada sorteo.
- Cuenta frecuencias, repeticiones, parejas, distancias y distribución de pares/impares usando únicamente esos seis números.
- Guarda y analiza exclusivamente los seis números principales; los campos auxiliares no se almacenan en el histórico normalizado.
- Permite consultar el histórico por fechas, paginar los resultados y descargar el archivo JSON.
- Analiza secuencialmente las combinaciones anteriores y compara los aciertos con una referencia aleatoria reproducible.
- Incluye una versión estática para GitHub Pages.

## Laboratorio de análisis

El motor usa una ventana fija de **7 sorteos** y combina siete enfoques estadísticos. Para cada prueba, la predicción se genera usando solo sorteos anteriores al resultado que se evalúa. El único objetivo del modelo es evaluar los aciertos de los seis números principales.

La interfaz de análisis requiere al menos **8 sorteos oficiales**: 7 para formar la primera ventana y uno posterior para evaluar la primera predicción. Mientras no haya datos suficientes, la aplicación muestra un aviso y el proceso de construcción no falla. Las predicciones son experimentales; los patrones pasados no garantizan premios ni una ventaja frente al azar.

## Registro prospectivo de predicciones

El workflow guarda cada combinación en `data/forecast-issued.json` antes de que exista el resultado de su fecha objetivo. Cada registro conserva la fecha de emisión, los datos usados, la versión, la ventana, los seis números y una huella SHA-256; si ya existe una predicción para esa fecha, no se reemplaza. Cuando se publica el resultado oficial, `scripts/archive_forecast.py` evalúa la combinación original y guarda los aciertos en `data/forecast-history.json`. Las predicciones históricas anteriores al registro prospectivo no se consideran evidencia independiente. La comparación prospectiva empieza con los registros emitidos por este mecanismo y no garantiza ventaja predictiva.

## Archivos principales

- `engine/model.js`: motor estadístico basado exclusivamente en los seis números principales.
- `web/logic.js`: frecuencias y resumen de aciertos.
- `web/index.html`: interfaz fuente.
- `public/index.html`: interfaz estática publicada en GitHub Pages.
- `data/draws.json`: archivo normalizado de resultados oficiales.
- `scripts/update_data.py`: descarga y validación del histórico oficial de SELAE.
- `scripts/build.mjs`: genera la web estática y el análisis cuando hay suficientes datos.

Los archivos oficiales pueden contener campos auxiliares para verificar la fuente, pero la aplicación normaliza los sorteos y entrega al motor solo la fecha y los seis números principales.

## Ejecutar localmente

Requiere Node.js 22+ y Python 3.12+.

```sh
python scripts/update_data.py
npm test
npm run build
python -m http.server 8000 --directory public
```

Abrir http://localhost:8000.

## Publicación y actualización

Repositorio: https://github.com/danielMigales/BonolotoGPT

El workflow **Publicar BonolotoGPT en GitHub Pages** intenta actualizar el histórico, valida los datos, archiva la predicción cuyo sorteo ya tenga resultado, reconstruye la aplicación, ejecuta las pruebas y publica `public/`. Se ejecuta con cada push a `main`, manualmente y mediante una ejecución diaria que espera a las 23:00 de Madrid. El botón de recarga de la web solo vuelve a leer los datos ya publicados; la descarga oficial y la publicación las realiza el workflow. La actualización automática depende de que la descarga y validación de datos finalice correctamente.

El workflow **Validar BonolotoGPT** ejecuta las pruebas y valida los archivos estáticos generados para GitHub Pages.

Nunca se deben inventar resultados ni rellenar el histórico con datos de ejemplo. Si SELAE no proporciona datos válidos, la actualización debe fallar en vez de publicar resultados inventados.
