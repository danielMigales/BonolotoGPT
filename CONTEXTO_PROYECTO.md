# CONTEXTO DEL PROYECTO — BonolotoGPT

**Última actualización:** 15-11-2026  
**Repositorio:** https://github.com/danielMigales/BonolotoGPT  
**Web publicada:** https://danielmigales.github.io/BonolotoGPT/

Este archivo es la referencia de continuidad del proyecto. Antes de modificar código, leer este documento y revisar el estado real del repositorio, los tests y GitHub Actions. No pedir al usuario que repita decisiones que ya constan aquí.

## 1. Objetivo real

Construir y mantener BonolotoGPT como una aplicación útil, honesta y verificable para analizar sorteos y generar **dos apuestas**.

La prioridad no es aparentar que la IA predice el azar. La prioridad es:
- mantener los datos de sorteos correctos y trazables;
- generar dos combinaciones con el mismo nivel de importancia;
- explicar por qué se propone cada número;
- medir el rendimiento real con backtesting histórico sin filtración de datos futuros;
- comparar el método contra una selección aleatoria equivalente;
- mostrar resultados, límites e incertidumbre con transparencia.

La Bonoloto es un juego aleatorio. No prometer aciertos ni afirmar que una combinación tiene más probabilidades reales de salir sin evidencia estadística sólida. El rendimiento histórico no garantiza resultados futuros.

## 2. Decisión fundamental del usuario

**Las dos apuestas tienen la misma importancia.** El usuario lo dejó expresamente claro: «Yo la considero igual de importante que la primera. En este juego se han de elegir dos apuestas».

Por tanto:
- no tratar la segunda apuesta como una sugerencia secundaria;
- generar, explicar, registrar y evaluar ambas;
- presentar métricas separadas para primera y segunda apuesta, además de métricas conjuntas cuando proceda;
- no mejorar la primera a costa de ignorar la segunda;
- evitar que la segunda sea simplemente una copia de la primera; pero cualquier diversificación debe respetar exactamente los filtros y restricciones del modelo.

## 3. Reglas de trabajo obligatorias

1. **Hacer cambios reales** en el repositorio cuando el usuario pida actualizar, arreglar o modificar. No limitarse a dar consejos o planes.
2. Antes de editar, consultar el código actual y el estado de GitHub Actions. No asumir que el resumen anterior sigue siendo el estado actual.
3. No decir «arreglado», «publicado» o «funciona» hasta comprobarlo.
4. Ejecutar/consultar validación y despliegue. Si fallan, leer los logs, localizar la causa, corregir y volver a validar.
5. No ocultar fallos ni dar por bueno un despliegue solo porque se haya creado un commit.
6. No eliminar ni sobrescribir datos de sorteos manuales al actualizar desde fuentes externas.
7. Registrar procedencia de los datos: SELAE, TuLotero u otra fuente, y distinguir datos contrastados de datos aportados por el usuario.
8. Mantener la aplicación y su documentación coherentes con la versión realmente desplegada.
9. Evitar pedir al usuario que repita información ya presente en este archivo o en el repositorio.
10. Responder en español, con claridad y sin promesas exageradas.

## 4. Datos y cambios conocidos

### Sorteo del 15-11-2026
Datos facilitados por el usuario desde la app TuLotero:
- Números: **02, 13, 19, 26, 36, 42**
- Complementario: **47**
- Reintegro: **07**

Se incorporaron a `data/draws.json` mediante el commit `301947fca0646f0e890c93caccd4ba0d41dfef30`. Deben identificarse como datos aportados por el usuario y pendientes de contraste con SELAE; no presentarlos como verificados oficialmente sin contrastarlos.

### Preservación de sorteos manuales
El script `scripts/update_data.py` fue modificado para preservar sorteos manuales. Commit:
`e439a48674bb9a30bca81765717cd4fbe4885239`.

### Despliegue
El workflow de despliegue se modificó para hacer pull --rebase antes del push y evitar carreras. Commit:
`d517800598ab7dee1ba284028f02cce80bbd6755`.
Run conocido como exitoso: `43762811267`.

### Segunda apuesta y evaluación
Cambios previos:
- `engine/model.js`, commit `aa1bb2ac...`: análisis de combinación concreta; backtest separado de segunda combinación; métricas `secondHits`, histograma, media, `atLeastThree` y `atLeastFour`; registro de `predictedSecond`, `secondNumbers` y razones.
- `web/index.html`, commit `d5fd99c...`: interfaz de segunda combinación con análisis equivalente.
- `tests/model.test.mjs`, commit `47ba573...`: tests.
- Versión 2.11.0, commit `3f0a11a...`; test de versión, commit `80c84050...`.
- Fallback para evitar que ambas combinaciones sean idénticas: commit `ad809d4...`.

## 5. Incidencia técnica pendiente al 15-11-2026

Los workflows de validación y despliegue fallaron tras el commit `ad809d4...`:
- Validate: run `43763593356`
- Deploy: run `43763593357`

Ambos fallaron en el test:
`tests/tracking.test.mjs` — «La predicción próxima respeta el filtro de frecuencia y avisa si no hay candidatos suficientes».

Causa diagnosticada: el fallback de la segunda combinación usaba `numberScores` (ranking general) en lugar de `eligibleScores` (candidatos que sí cumplen el filtro). Esto podía introducir números no elegibles.

Se cambió a:
```js
secondNumbers = secondCombo || diversifyCombination(numbers, eligibleScores, 3);
```
Commit:
`7e1411dfd98b8f51f5ea5fad518be5016c1b41a9`.

**Importante:** en la última comprobación disponible, estos workflows aún estaban en cola:
- Validate: run `43763723965`
- Deploy: run `43763723961`

Enlaces:
- https://github.com/danielMigales/BonolotoGPT/actions/runs/43763723965
- https://github.com/danielMigales/BonolotoGPT/actions/runs/43763723961

Este estado está desactualizable: comprobar ahora el estado real. También revisar si `diversifyCombination(numbers, eligibleScores, 3)` puede fallar cuando hay menos de tres alternativas elegibles. Si no hay candidatos suficientes, el comportamiento correcto es mostrar una advertencia y no saltarse el filtro para completar artificialmente la combinación.

## 6. Siguiente trabajo técnico recomendado

1. Consultar el último commit y los workflows de GitHub Actions.
2. Si Validate falla, abrir el job y leer el log completo del test que falla.
3. Corregir el problema de raíz y añadir una prueba de regresión.
4. Verificar el caso de pocos candidatos elegibles para la segunda combinación. Nunca rellenar con números que incumplen el filtro sin indicarlo claramente.
5. Revisar que ambas apuestas se generan, guardan y evalúan con el mismo rigor.
6. Construir una evaluación histórica honesta, idealmente walk-forward: para cada sorteo histórico, generar las apuestas usando solo datos anteriores a ese sorteo. Comparar con muchas apuestas aleatorias de control bajo las mismas condiciones.
7. Mostrar métricas comprensibles: distribución de aciertos por apuesta, frecuencia de 2/3/4/5/6 aciertos, media y comparación con azar. Incluir tamaño de muestra e incertidumbre. No confundir una racha o un resultado aislado con capacidad predictiva.
8. Solo después de Validate y Deploy exitosos, comprobar la web desplegada y comunicarlo.

## 7. Comunicación con el usuario

El usuario está legítimamente frustrado por haber tenido que repetir requisitos y por cambios que han fallado. No responder con otra lista de promesas vagas. Tomar acción, comprobar y comunicar hechos concretos:
- qué se ha cambiado;
- qué tests han pasado o fallado;
- qué queda pendiente;
- enlace al commit o workflow cuando exista.

No atribuir capacidad predictiva fiable a la IA. El objetivo es medir con rigor si el método supera o no a una referencia aleatoria, no fingir que puede anticipar un sorteo.

---
**Regla principal para futuras sesiones:** leer este archivo antes de actuar y continuar desde el estado real del repositorio, sin hacer que el usuario vuelva a explicar que quiere dos apuestas igual de importantes y una evaluación estadística honesta desde el principio.
