# Historial de trabajo — BonolotoGPT

Última revisión: 25 de noviembre de 2026.

## Decisiones vigentes

- El proyecto se dedica exclusivamente a Bonoloto.
- La combinación analizada contiene seis números principales distintos entre 1 y 49.
- El objetivo es evaluar aciertos sobre los seis números principales.
- El histórico normalizado conserva los resultados y su procedencia.
- No se declara completada una tarea hasta ejecutar pruebas y revisar la publicación.
- Los resultados que el propietario introduce manualmente cuando SELAE falla se consideran válidos.
- No añadir automatizaciones ni modificar workflows, histórico o flujo de actualización sin autorización expresa.
- Antes de modificar código se debe leer la documentación completa pertinente. Cada cambio autorizado debe registrarse en este historial y reflejarse en los documentos técnicos afectados en el mismo trabajo.

## Limpieza aplicada

Motor, interfaz, datos generados, pruebas y workflows comparten ahora un único flujo de propuesta y evaluación. Los módulos heredados sin uso se han retirado.

## 24 de noviembre de 2026 — Cambio de método

- Se sustituye la recencia ponderada por parejas habituales.
- La versión publicada utiliza una ventana de siete sorteos.
- La primera combinación maximiza la suma de las frecuencias de sus 15 parejas.
- La segunda aplica el mismo criterio y comparte como máximo tres números con la primera.
- Se actualizaron motor, pruebas, interfaz, construcción y documentación. No se modificaron workflows ni el histórico.

## 25 de noviembre de 2026 — Nueva especificación solicitada para el laboratorio

- El propietario solicita siete pestañas independientes, una por método.
- Cada pestaña debe mostrar dos combinaciones de seis números.
- La ventana de análisis debe limitarse a los diez sorteos más recientes del año en curso.
- Queda excluido el histórico de años anteriores; no se pueden usar sorteos antiguos para completar la ventana.
- El propietario menciona expresamente Markov, recencia ponderada, Bayes y frecuencia acumulada.
- Parejas habituales es el método publicado actualmente y debe contemplarse en el inventario.
- La revisión disponible no acredita siete métodos predictivos independientes ya implementados: Markov y Bayes no se han encontrado como implementaciones previas; frecuencia acumulada aparece como estadística descriptiva; recencia ponderada existió en una versión anterior; parejas habituales es el método publicado.
- **No se cierra todavía la lista de siete métodos ni sus fórmulas.** Antes de programar hay que completar el inventario documental y técnico, distinguir métodos existentes de nuevos y registrar la definición final.
- Estado: requisitos registrados; implementación pendiente.

## 25 de noviembre de 2026 — Registro de mantenimiento documental

- Se establece que la documentación debe consultarse antes de cada intervención.
- Cada cambio autorizado debe quedar anotado en este historial y en los documentos técnicos afectados en el mismo trabajo.
- El registro debe incluir decisiones, criterios y fórmulas, parámetros, archivos modificados, pruebas realizadas, limitaciones, tareas pendientes y decisiones descartadas.
- Esta intervención modifica únicamente documentación. No modifica código, histórico, workflows, automatizaciones ni la web publicada.
