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
6. Leer la documentación completa pertinente antes de tocar código.
7. Registrar cada cambio autorizado en el historial y actualizar los documentos técnicos afectados en el mismo trabajo.
8. No añadir automatizaciones ni modificar workflows, histórico o flujo de actualización sin autorización expresa.

## Estado publicado del laboratorio

El método publicado utiliza parejas habituales sobre los siete sorteos más recientes disponibles. La puntuación de cada combinación es la suma de las frecuencias de sus 15 parejas dentro de esa ventana. La primera maximiza la puntuación; la segunda aplica el mismo criterio con un máximo de tres números compartidos. El backtest también utiliza ventanas cronológicas de siete sorteos.

## Nueva especificación solicitada — 25-11-2026 (pendiente)

- Crear siete pestañas, una por método, sin mezclar criterios entre pestañas.
- Generar dos combinaciones de seis números en cada pestaña.
- Utilizar exclusivamente los diez sorteos más recientes del año en curso.
- Excluir por completo los sorteos de años anteriores, incluso si no hay diez sorteos del año en curso.
- Métodos nombrados expresamente: Markov, recencia ponderada, Bayes y frecuencia acumulada.
- Parejas habituales, método actualmente publicado, debe formar parte del inventario para el nuevo laboratorio.
- No se ha acreditado que el repositorio contenga ya siete métodos predictivos independientes. Markov y Bayes no se han encontrado implementados; frecuencia acumulada aparece como estadística descriptiva; recencia ponderada existió en una versión anterior.
- Antes de implementar, completar el inventario de métodos en la documentación y código, identificar los restantes y definir las fórmulas de los siete. La lista definitiva no está cerrada y no debe sustituirse por una propuesta no confirmada.

Esta especificación no cambia por sí sola el código ni la web publicada.

## DECISIONES VIGENTES CONFIRMADAS POR EL PROPIETARIO — 24-11-2026

- **Carga de resultados recientes:** la descarga automática desde SELAE falla repetidamente. Cuando SELAE no está disponible, el propietario facilita los resultados y se introducen manualmente. Esos resultados se consideran válidos y fiables; no se deben etiquetar como falsos ni cuestionar por el mero hecho de ser una entrada manual.
- **Actualización automática:** no funciona de forma fiable y no debe darse por operativa ni proponerse como si ya resolviera la actualización. El flujo manual facilitado por el propietario es el procedimiento práctico vigente.
- **Método de parejas habituales:** se cuentan las frecuencias de las 15 parejas de cada combinación. La segunda combinación comparte como máximo tres números con la primera. El alcance temporal del modelo publicado queda descrito en el apartado de estado publicado.
- **Periodo de datos relevante:** desde el **1 de enero del año en curso**. El histórico desde 1988 no es un objetivo del proyecto y no debe imponerse ni presentarse como requisito.
- **Tolerancia a errores del histórico:** un fallo o discrepancia del histórico no debe bloquear la carga de la página web.
- **APK Android:** prueba descartada; no se actualiza correctamente. No es una línea activa de desarrollo.
- **Comunicación sobre resultados:** no repetir como argumento de trabajo que «el azar es mejor que el algoritmo».
- **Respeto al alcance:** no modificar algoritmo, parámetros, fuentes, periodo de datos, flujo de actualización ni plataforma por iniciativa propia.
- **Registro de continuidad:** las decisiones del propietario prevalecen frente a notas antiguas o contradictorias.
