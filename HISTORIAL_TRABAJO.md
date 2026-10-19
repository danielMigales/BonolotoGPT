# Historial de trabajo — PrimitivaGPT

> Última revisión: 2026-10-19. Este registro se reconstruye a partir del historial de Git, la documentación y las ejecuciones de GitHub Actions disponibles. No sustituye ni pretende reproducir chats eliminados. Actualizarlo cuando se complete una tarea relevante.

## Objetivo y forma de trabajo

- Repositorio de referencia: https://github.com/danielMigales/PrimitivaGPT
- Rama principal: `main`.
- Mantener un registro verificable de cambios, decisiones, pruebas, despliegues, incidencias y pendientes.
- No declarar una tarea terminada solo porque el código se haya editado: comprobar pruebas, workflows y despliegue cuando corresponda.
- No inventar resultados de SELAE ni afirmar que una publicación se ha comprobado visualmente si no se ha hecho.
- Mantener los artefactos generados sincronizados con las fuentes de las que proceden.

## Estado actual

### Integrado en `main`

| Fecha (UTC) | Commit | Cambio |
|---|---|---|
| 2026-10-19 | `e4dcd350e422d66b93420729808e37ce97793e67` | Mostrar el resultado oficial de una propuesta durante 24 horas desde que PrimitivaGPT lo detecta/confirma; conservar el histórico. PR #5. |
| 2026-10-19 | `957d84f439aa9a90e5f5a2e79c689d116b961e38` | Explicar la combinación propuesta: criterios, puntuaciones y expertos con mayor peso, sin atribuir puntuaciones incorrectas a propuestas guardadas distintas del recálculo actual. |
| 2026-10-19 | `92f11e0f7cdb12c79151a5955a7ac51166f52468` | Fijar Laboratorio IA en 15 sorteos en la interfaz pública/API y retirar el selector; conservar opciones internas para pruebas históricas. |
| 2026-10-19 | `3a78116326b4ceb60621b26aefc4bce470887407` | Preparar la publicación: corregir validación y generación de informes, icono, actualización segura del histórico y artefactos generados. PR #2. |
| 2026-10-18 | `71f2efb2ba54ae927abab9fdd105deec8cf6fc28` | Actualizar prueba para el panel histórico oculto. |
| 2026-10-18 | `cc332b18f8a0bf350314d3e63d7006377bab0721` | Corregir estructura HTML de elementos `tbody` ocultos. |
| 2026-10-18 | `65de6778adeb39381b0eb8099eebf12efa2c5feb` | Evitar referencias nulas tras ocultar paneles del laboratorio. |
| 2026-10-18 | `ac377177aee7411d238570932ce23d9b49b3119d` | Ocultar el desplegable de simulaciones históricas en HTML. |
| 2026-10-18 | `ee1f0c2216dc995b2d309859145fd430a9679567` | Ocultar el seguimiento real cuando no hay datos, sin cambiar su lógica de cálculo. |

## Comportamiento y decisiones conocidas

- La aplicación ofrece un archivo de sorteos oficiales y un Laboratorio IA.
- El Laboratorio IA público utiliza una ventana fija de 15 sorteos.
- El motor combina siete métodos: azar uniforme, frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas/estructura, Bayes regularizado y Markov regularizado. El reintegro tiene pesos independientes.
- La propuesta debe explicar los criterios realmente usados; no presentar como actuales puntuaciones que pertenecen a otra combinación.
- Los paneles «Métodos y aprendizaje» y simulaciones históricas se mantienen ocultos en la interfaz según las decisiones registradas; el código de cálculo puede seguir siendo necesario para el motor y las pruebas.
- No presentar seguimiento real como si tuviera resultados oficiales cuando todavía no los hay.
- Las simulaciones históricas no deben confundirse ni sumarse a evaluaciones de propuestas reales.
- No se garantizan premios ni se afirma que el modelo tenga una ventaja demostrada frente al azar.
- El resultado oficial se muestra durante 24 horas desde que PrimitivaGPT lo detecta y confirma. La fuente de SELAE consultada no proporciona una marca de tiempo fiable de publicación, así que el contador no necesariamente empieza en el instante en que SELAE lo publica.
- La documentación indica que el workflow de validación construye la aplicación, pero no debe asumirse que descarga SELAE o que el histórico se actualiza automáticamente cada hora. No se ha verificado una automatización externa activa.
- La antigua publicación de ChatGPT Sites dejó de estar disponible; no tratar su URL anterior como activa. GitHub Pages tiene un flujo de publicación estática, que no sustituye las funciones persistentes del Worker.

## Validación y despliegue más recientes

- Validación en GitHub Actions, run `39241461669`: https://github.com/danielMigales/PrimitivaGPT/actions/runs/39241461669 — resultado registrado: éxito.
- Publicación de GitHub Pages, run `39241461551`: https://github.com/danielMigales/PrimitivaGPT/actions/runs/39241461551 — resultado registrado: éxito.
- PR #5, «Mostrar resultado oficial durante 24 horas», fusionada: https://github.com/danielMigales/PrimitivaGPT/pull/5
- Estos resultados acreditan los workflows automatizados, no una inspección visual en un móvil real ni una nueva sincronización real con SELAE.

## Incidencias tratadas en el historial

- Error JavaScript al intentar asignar `textContent` a una referencia nula tras ocultar paneles: se añadió una corrección para evitar referencias nulas y se ajustaron las pruebas de HTML.
- Fallos de pruebas y artefactos generados: se documentaron correcciones en la generación de informes, validación de datos y sincronización de Worker/estáticos.
- Selector de ventana del Laboratorio IA: retirado de la interfaz pública y fijado a 15 sorteos, manteniendo opciones internas para pruebas.
- Afirmaciones de actualización horaria automática: se corrigió la documentación/interfaz para no prometer una actualización que no está acreditada por el workflow.

## Pendientes / verificaciones no acreditadas

1. Verificar con datos oficiales nuevos, cuando corresponda, el recorrido completo desde sincronización de SELAE hasta la presentación del resultado en la aplicación.
2. Comprobar visualmente el resultado temporal en un dispositivo real; hasta ahora no se registra esa comprobación.
3. Verificar por separado qué despliegue se está usando (GitHub Pages estático o Worker) y qué funciones persistentes ofrece cada uno.
4. Confirmar la existencia y funcionamiento de cualquier automatización externa de actualización de SELAE antes de describirla como activa.
5. Añadir aquí futuras tareas con enlaces a PR/commit, estado de pruebas y limitaciones conocidas.

## Cómo mantener este registro

Al cerrar una tarea importante, añadir fecha, objetivo, PR/commit, archivos o áreas afectados, pruebas ejecutadas con sus enlaces, estado del despliegue y cualquier limitación. Mantener separadas las tareas terminadas de las que solo están propuestas o pendientes.
