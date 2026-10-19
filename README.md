# BonolotoGPT · Archivo y análisis de Bonoloto

Aplicación web en español para consultar los últimos cinco sorteos de Bonoloto, el histórico oficial desde el **1 de enero de 2026** y un laboratorio experimental de análisis.

## Qué hace

- Muestra exclusivamente los **seis números principales** de cada sorteo.
- Cuenta frecuencias, repeticiones, parejas, distancias y distribución de pares/impares usando únicamente esos seis números.
- Excluye el complementario y el reintegro de la presentación, las estadísticas, el motor de predicción y la evaluación de aciertos.
- Permite consultar el histórico por fechas, paginar los resultados y descargar el archivo JSON.
- Analiza secuencialmente las combinaciones anteriores y compara los aciertos con una referencia aleatoria reproducible.
- Incluye una versión estática para GitHub Pages.

## Laboratorio de análisis

El motor usa una ventana fija de 15 sorteos iniciales y combina siete enfoques estadísticos. Para cada prueba, la predicción se genera usando solo sorteos anteriores al resultado que se evalúa. El complementario y el reintegro no forman parte de las entradas estadísticas ni de los objetivos del modelo.

La interfaz de análisis requiere al menos **16 sorteos oficiales**: 15 para iniciar la ventana y uno posterior para evaluar la primera predicción. Mientras no haya datos suficientes, la aplicación muestra un aviso y el proceso de construcción no falla. Las predicciones son experimentales; los patrones pasados no garantizan premios ni una ventaja frente al azar.

## Archivos principales

- `engine/model.js`: motor estadístico basado exclusivamente en los seis números principales.
- `web/logic.js`: frecuencias y resumen de aciertos.
- `web/index.html`: interfaz fuente.
- `public/index.html`: interfaz estática publicada en GitHub Pages.
- `worker/template.js`: plantilla del Worker y validación del histórico.
- `data/draws.json`: archivo normalizado de resultados oficiales.
- `scripts/update_data.py`: descarga y validación del histórico oficial de SELAE.
- `scripts/build.mjs`: genera la interfaz, el Worker y el análisis cuando hay suficientes datos.

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

El workflow **Publicar BonolotoGPT en GitHub Pages** intenta descargar y validar el histórico oficial, construye la aplicación, ejecuta las pruebas y publica `public/`. Se ejecuta al hacer push a `main` o manualmente desde GitHub Actions; no hay una programación horaria configurada en este repositorio. La publicación solo queda confirmada cuando el workflow termina correctamente.

El workflow **Validar BonolotoGPT** ejecuta las pruebas y comprueba que el Worker generado esté sincronizado con sus fuentes.

Nunca se deben inventar resultados ni rellenar el histórico con datos de ejemplo. Si SELAE no proporciona datos válidos, la actualización debe fallar en vez de publicar resultados inventados.
