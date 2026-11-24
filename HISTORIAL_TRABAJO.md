# Historial de trabajo — BonolotoGPT

Última revisión: 16 de noviembre de 2026.

## Decisiones vigentes

- El proyecto se dedica exclusivamente a Bonoloto.
- La combinación analizada contiene seis números principales distintos entre 1 y 49.
- El único objetivo es evaluar aciertos sobre los seis números principales.
- El histórico normalizado conserva los resultados y su procedencia.
- La ventana pública del Laboratorio IA es fija en siete sorteos.
- La aplicación requiere ocho sorteos para evaluar la primera predicción.
- No se declara completada una tarea hasta ejecutar pruebas y revisar la publicación.

## Limpieza aplicada

Motor, interfaz, datos generados, pruebas y workflows comparten ahora un único flujo de propuesta y evaluación. Los módulos heredados sin uso se han retirado.

## 24 de noviembre de 2026 — Cambio autorizado de método

- Se sustituye la recencia ponderada por parejas habituales.
- El cálculo utiliza todos los sorteos desde el 1 de enero de 2026, sin ponderar antigüedad.
- La primera combinación maximiza la suma de las frecuencias de sus 15 parejas.
- La segunda aplica el mismo criterio y comparte como máximo tres números con la primera.
- Se actualizan motor, pruebas, interfaz, construcción y documentación. No se modifican workflows ni el histórico.
