# BonolotoGPT — versión mínima

La aplicación solo muestra los 10 sorteos más recientes de Bonoloto y marca en rojo los números principales que aparecen en más de un sorteo de esa lista.

- **Sin sincronización automática con SELAE.**
- Los resultados se incorporan manualmente cuando el usuario los facilita.
- Se guardan como máximo 10 sorteos, del más reciente al más antiguo.
- El complementario y el reintegro se muestran aparte y no cuentan para marcar repetidos.
- GitHub Actions valida los datos y publica la página. Si la validación o la publicación falla, el workflow queda marcado como fallido; no descarga ni inventa resultados.
- No hay predicciones, laboratorio ni análisis adicionales.

El archivo inicial de sorteos está vacío para empezar desde cero. Tras introducir resultados manualmente, la web mostrará los que haya cargados, hasta un máximo de 10.
