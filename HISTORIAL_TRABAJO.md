# Historial de trabajo — BonolotoGPT

Última revisión: 25 de noviembre de 2026.

## Decisiones vigentes

- El proyecto se dedica exclusivamente a Bonoloto.
- La combinación analizada contiene seis números principales distintos entre 1 y 49.
- El único objetivo es evaluar aciertos sobre los seis números principales.
- El histórico normalizado conserva los resultados y su procedencia.
- No se declara completada una tarea hasta ejecutar pruebas y revisar la publicación.
- Los resultados que el propietario introduce manualmente cuando SELAE falla se consideran válidos.
- No añadir automatizaciones ni modificar workflows, histórico o flujo de actualización sin autorización expresa.
- Antes de modificar código se debe leer la documentación. Todo cambio autorizado debe registrarse en este historial y reflejarse en los documentos técnicos afectados en el mismo trabajo.

## Limpieza aplicada

Motor, interfaz, datos generados, pruebas y workflows comparten ahora un único flujo de propuesta y evaluación. Los módulos heredados sin uso se han retirado.

## 24 de noviembre de 2026 — Cambio autorizado de método

- Se sustituye la recencia ponderada por parejas habituales.
- El cálculo utiliza todos los sorteos desde el 1 de enero de 2026, sin ponderar antigüedad.
- La primera combinación maximiza la suma de las frecuencias de sus 15 parejas.
- La segunda aplica el mismo criterio y comparte como máximo tres números con la primera.
- Se actualizan motor, pruebas, interfaz, construcción y documentación. No se modifican workflows ni el histórico.

## 25 de noviembre de 2026 — Nueva especificación solicitada para el laboratorio

- El propietario solicita siete pestañas independientes, una por método.
- Cada pestaña debe mostrar dos combinaciones de seis números.
- La ventana de análisis debe limitarse a los diez sorteos más recientes del año en curso.
- Queda excluido el histórico de años anteriores; no se puede recurrir a sorteos antiguos para completar la ventana.
- El propietario menciona expresamente los métodos Markov, recencia ponderada, Bayes y frecuencia acumulada.
- Parejas habituales es el método activo actual y forma parte de los métodos que deben contemplarse.
- La revisión documental/código realizada no acredita que existan siete métodos predictivos independientes ya implementados. Markov y Bayes no se han encontrado como implementaciones anteriores; frecuencia acumulada aparece como estadística descriptiva; recencia ponderada existió en una versión previa; parejas habituales es el método actual.
- **No se da por cerrada la lista de siete métodos ni sus fórmulas.** Antes de programar hay que terminar el inventario documental, distinguir métodos existentes de nuevos y registrar la definición final.
- Estado: especificación registrada; implementación todavía pendiente. En esta intervención solo se actualiza documentación. No se modifica código, histórico, workflows ni automatizaciones.
