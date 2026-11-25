# CONTEXTO DEL PROYECTO — BonolotoGPT

**Última actualización:** 25-11-2026  
**Repositorio:** https://github.com/danielMigales/BonolotoGPT  
**Web:** https://danielmigales.github.io/BonolotoGPT/

## Objetivo vigente

BonolotoGPT consulta el histórico de Bonoloto, analiza frecuencias, repeticiones, intervalos, parejas y patrones, y presenta dos combinaciones de seis números con igual importancia, explicadas y evaluadas por separado.

La Bonoloto es aleatoria. No se promete capacidad predictiva ni se presenta el análisis histórico como una ventaja garantizada.

## Reglas de trabajo

1. No modificar el algoritmo ni añadir criterios sin autorización expresa.
2. Antes de declarar una tarea terminada, ejecutar `npm test` y `npm run build` y revisar GitHub Actions.
3. No inventar resultados ni sobrescribir sorteos manuales.
4. Mantener sincronizados motor, interfaz, datos generados y documentación.
5. Comunicar con precisión qué se ha cambiado y qué se ha verificado.
6. Leer la documentación del proyecto antes de tocar código. Registrar en el historial cada decisión y cambio autorizado, y actualizar los documentos técnicos afectados en el mismo trabajo.
7. No añadir automatizaciones ni modificar workflows, histórico o flujo de actualización sin autorización expresa.

## Estado del modelo activo

El modelo actualmente implementado utiliza parejas habituales: suma las frecuencias de las 15 parejas de cada combinación con los sorteos desde el 1 de enero de 2026. La primera maximiza la puntuación; la segunda aplica el mismo criterio con un máximo de tres números compartidos.

## NUEVA ESPECIFICACIÓN SOLICITADA — 25-11-2026 (PENDIENTE)

El propietario ha solicitado rediseñar el Laboratorio:

- Siete pestañas independientes, una por método.
- Dos combinaciones de seis números en cada pestaña.
- Ventana de análisis limitada a los diez sorteos más recientes del año en curso.
- Exclusión absoluta de sorteos de años anteriores; no completar la ventana con datos de otro año.
- Métodos expresamente mencionados por el propietario: Markov, recencia ponderada, Bayes y frecuencia acumulada.
- Parejas habituales es el método activo actual y debe figurar entre los métodos a considerar.

**Pendiente antes de programar:** identificar rigurosamente en la documentación y el código los otros métodos disponibles. La revisión realizada hasta ahora no ha encontrado siete algoritmos predictivos ya implementados: Markov y Bayes no constaban como implementaciones; frecuencia acumulada y otras métricas aparecían como estadísticas descriptivas. No convertir una propuesta del asistente en decisión del propietario. La lista definitiva y las fórmulas de los siete métodos deben quedar documentadas antes de implementarse.

## DECISIONES VIGENTES CONFIRMADAS POR EL PROPIETARIO — 24-11-2026

- **Carga de resultados recientes:** la descarga automática desde SELAE falla repetidamente. Cuando SELAE no está disponible, el propietario facilita los resultados y se introducen manualmente. Esos resultados se consideran válidos y fiables; no se deben etiquetar como falsos ni cuestionar por el mero hecho de ser una entrada manual.
- **Actualización automática:** no funciona de forma fiable y no debe darse por operativa ni proponerse como si ya resolviera la actualización. El flujo manual facilitado por el propietario es el procedimiento práctico vigente.
- **Modelo activo (24-11-2026):** parejas habituales. Se cuentan las frecuencias de las 15 parejas de cada combinación usando todos los sorteos desde el 1 de enero de 2026, sin ponderar antigüedad. La primera maximiza la suma; la segunda maximiza la misma suma con un máximo de tres números compartidos. Esta decisión sustituyó la recencia ponderada como modelo activo.
- **Periodo de datos relevante:** desde el **1 de enero del año en curso**. El histórico desde 1988 no es un objetivo del proyecto y no debe imponerse ni presentarse como requisito.
- **Tolerancia a errores del histórico:** un fallo o discrepancia del histórico no debe bloquear la carga de la página web. La web debe poder cargar aunque el histórico o un artefacto de análisis tenga errores.
- **APK Android:** prueba descartada; no se actualiza correctamente. No es una línea activa de desarrollo ni debe proponerse como entregable vigente.
- **Comunicación sobre resultados:** no repetir como argumento de trabajo que «el azar es mejor que el algoritmo». El propietario no quiere que esa afirmación se use para desviar o descalificar el trabajo realizado.
- **Respeto al alcance:** no modificar algoritmo, parámetros, fuentes, periodo de datos, flujo de actualización ni plataforma por iniciativa propia. No reabrir decisiones ya tomadas. Antes de sugerir cambios, comprobar el contexto y distinguir entre una decisión deliberada y un defecto real.
- **Registro de continuidad:** estas decisiones prevalecen frente a notas antiguas o contradictorias del repositorio.
