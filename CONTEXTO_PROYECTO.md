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
