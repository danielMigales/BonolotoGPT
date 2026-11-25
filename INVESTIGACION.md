# Investigación estadística — BonolotoGPT
Revisión: 25 de noviembre de 2026. Método publicado: parejas habituales.

## Objetivo
Evaluar dos combinaciones de seis números distintos del 1 al 49, utilizando exclusivamente los seis números principales de cada sorteo.

## Método publicado actualmente
- Ventana: los siete sorteos más recientes disponibles.
- Se cuentan las coapariciones de cada pareja no ordenada de números.
- La puntuación de una combinación es la suma de las frecuencias de sus 15 parejas.
- La primera combinación maximiza esa puntuación.
- La segunda maximiza la misma puntuación, con un máximo de tres números compartidos con la primera.
- El backtest utiliza ventanas cronológicas de siete sorteos.

## Nueva especificación solicitada — 25-11-2026
El propietario ha solicitado siete métodos en pestañas separadas, dos combinaciones por pestaña y una ventana limitada a los diez sorteos más recientes del año en curso. Queda excluido el uso de sorteos de años anteriores, incluso para completar diez observaciones.

Métodos nombrados expresamente por el propietario:
- Markov.
- Recencia ponderada.
- Bayes.
- Frecuencia acumulada.

El método de parejas habituales, actualmente publicado, también debe contemplarse en el inventario del nuevo laboratorio.

## Inventario documental y técnico encontrado
- **Parejas habituales:** método implementado en la versión publicada.
- **Recencia ponderada exponencial:** existió en una versión anterior. La implementación histórica utilizaba decaimiento `0.5 ** (antigüedad / semivida)`, con semivida predeterminada de ocho sorteos. Fue sustituida como método activo.
- **Frecuencia acumulada:** aparece como estadística descriptiva; no se ha acreditado como algoritmo predictivo independiente.
- **Markov:** no se ha encontrado una implementación anterior documentada.
- **Bayes:** no se ha encontrado una implementación anterior documentada.
- Otras métricas como frecuencias recientes, parejas, gaps/intervalos y sumas aparecen como estadísticas descriptivas. No presentarlas automáticamente como algoritmos ya implementados.

## Trabajo pendiente
1. Completar el inventario en todos los archivos de documentación y código para identificar los siete métodos que se pretenden usar.
2. Distinguir algoritmos existentes de métodos nuevos que deban diseñarse.
3. Definir y documentar las fórmulas de los siete métodos antes de implementarlos.
4. Asegurar que cada pestaña utiliza exclusivamente su propio criterio y la misma ventana de diez sorteos del año en curso.
5. Generar dos combinaciones por método y explicar cómo se obtiene cada una.
6. No introducir datos de años anteriores ni recurrir a ellos si faltan sorteos del año actual.

## Evaluación
El backtest debe ser cronológico: para cada sorteo evaluado, una predicción solo puede utilizar sorteos anteriores disponibles dentro del periodo permitido. Las métricas retrospectivas describen el comportamiento histórico.

## Límites
Las frecuencias y patrones históricos describen observaciones pasadas. No deben presentarse como garantía de resultados futuros.
