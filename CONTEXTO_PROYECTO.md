# CONTEXTO DEL PROYECTO — BonolotoGPT

**Última actualización:** 16-11-2026  
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

## Estado

El modelo conserva seis métodos: frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas y estructura, Bayes regularizado y Markov regularizado. Se excluyen azar uniforme y transición de repetición. La interfaz presenta dos combinaciones diferenciadas, con un máximo de tres números compartidos; ambas se explican y se evalúan por separado. La propuesta sigue siendo experimental y no hay evidencia de ventaja frente al azar.


## DECISIONES VIGENTES CONFIRMADAS POR EL PROPIETARIO — 24-11-2026
> Esta sección prevalece sobre cualquier texto anterior de este documento que la contradiga. No reabrir estas decisiones ni presentar como novedades tareas ya realizadas.

- **Carga de resultados recientes:** la descarga automática desde SELAE falla repetidamente. Cuando SELAE no está disponible, el propietario facilita los resultados y se introducen manualmente. Esos resultados se consideran válidos y fiables; no se deben etiquetar como falsos ni cuestionar por el mero hecho de ser una entrada manual.
- **Actualización automática:** no funciona de forma fiable y no debe darse por operativa ni proponerse como si ya resolviera la actualización. El flujo manual facilitado por el propietario es el procedimiento práctico vigente.
- **Modelo activo:** únicamente recencia ponderada. Los demás métodos se probaron y, hasta ahora, no han demostrado aportar aciertos; no forman parte del modelo activo.
- **Semivida:** fijada en **8**, porque es la configuración que ha ofrecido el mejor resultado en las pruebas realizadas. No volver a comparar ni cambiar este valor salvo petición expresa del propietario.
- **Periodo de datos relevante:** desde el **1 de enero del año en curso**. El histórico desde 1988 no es un objetivo del proyecto y no debe imponerse ni presentarse como requisito.
- **Tolerancia a errores del histórico:** un fallo o discrepancia del histórico no debe bloquear la carga de la página web. La web debe poder cargar aunque el histórico o un artefacto de análisis tenga errores.
- **APK Android:** prueba descartada; no se actualiza correctamente. No es una línea activa de desarrollo ni debe proponerse como entregable vigente.
- **Comunicación sobre resultados:** no repetir como argumento de trabajo que «el azar es mejor que el algoritmo». El propietario no quiere que esa afirmación se use para desviar o descalificar el trabajo realizado.
- **Respeto al alcance:** no modificar algoritmo, parámetros, fuentes, periodo de datos, flujo de actualización ni plataforma por iniciativa propia. No reabrir decisiones ya tomadas. Antes de sugerir cambios, comprobar el contexto y distinguir entre una decisión deliberada y un defecto real.
- **Registro de continuidad:** estas decisiones son la referencia para futuras sesiones y prevalecen frente a notas antiguas o contradictorias del repositorio.

