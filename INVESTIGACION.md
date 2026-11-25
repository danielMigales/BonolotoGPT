# Investigación estadística — BonolotoGPT
Revisión: 25 de noviembre de 2026. Modelo activo en el código revisado: parejas habituales.

## Objetivo
Evaluar dos combinaciones de seis números distintos del 1 al 49, utilizando exclusivamente los seis números principales de cada sorteo.

## Método activo actual: parejas habituales
- Periodo de cálculo vigente en la versión actual: todos los sorteos disponibles desde el 1 de enero de 2026.
- Se cuentan las coapariciones de cada pareja no ordenada de números.
- La puntuación de una combinación es la suma de las frecuencias de sus 15 parejas.
- La primera combinación maximiza esa puntuación.
- La segunda maximiza la misma puntuación, con un máximo de tres números compartidos con la primera.
- En la versión actual no se pondera la antigüedad ni se mezclan otros métodos.

## Requisito solicitado para el siguiente laboratorio — 25-11-2026
El propietario ha pedido siete métodos en pestañas separadas, dos combinaciones por método y una ventana limitada a los diez sorteos más recientes del año en curso. Queda expresamente excluido el uso de sorteos de años anteriores, incluso para completar diez sorteos.

Métodos que el propietario ha nombrado expresamente:
- Markov.
- Recencia ponderada.
- Bayes.
- Frecuencia acumulada.

Parejas habituales es el método activo actual y debe incluirse en la definición de los métodos del nuevo laboratorio.

## Inventario documental comprobado hasta ahora
- **Parejas habituales:** método implementado en el motor actual.
- **Recencia ponderada exponencial:** existió en versiones anteriores del motor. La implementación histórica utilizaba decaimiento exponencial `0.5 ** (antigüedad / semivida)`, con semivida predeterminada de ocho sorteos. Fue sustituida como método activo por parejas habituales el 24-11-2026.
- **Frecuencia acumulada:** aparece como estadística descriptiva en el proyecto; no se ha acreditado como algoritmo predictivo independiente en el código revisado.
- **Markov:** no se ha encontrado una implementación anterior documentada.
- **Bayes:** no se ha encontrado una implementación anterior documentada.
- Otras métricas como frecuencias recientes, parejas, gaps/intervalos y sumas aparecen en estadísticas descriptivas. No deben presentarse automáticamente como métodos ya implementados.

## Trabajo pendiente
1. Completar el inventario de la documentación y del código para identificar los métodos que el propietario espera incluir y los otros métodos existentes.
2. Distinguir con claridad los algoritmos históricos reales de los métodos nuevos que deban diseñarse.
3. Definir y documentar las fórmulas de los siete métodos antes de implementarlos.
4. Asegurar que cada pestaña utiliza exclusivamente su propio criterio y la misma ventana de diez sorteos del año en curso.
5. Generar dos combinaciones por método y explicar de forma transparente cómo se obtiene cada una.
6. No introducir datos de años anteriores ni recurrir a ellos si faltan sorteos en el año actual.

## Evaluación
El backtest debe ser cronológico: para cada sorteo evaluado, una predicción solo puede utilizar sorteos anteriores disponibles dentro del periodo permitido. Las métricas retrospectivas describen el comportamiento histórico.

## Límites
Las frecuencias y patrones históricos describen coapariciones observadas. No deben presentarse como garantía de resultados futuros.
