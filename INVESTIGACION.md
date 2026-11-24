# Investigación estadística — BonolotoGPT
Revisión: 24 de noviembre de 2026. Modelo activo: parejas habituales.

## Objetivo
Evaluar dos combinaciones de seis números distintos del 1 al 49, utilizando exclusivamente los seis números principales de cada sorteo.

## Método activo
- Periodo de cálculo: todos los sorteos disponibles desde el 1 de enero de 2026.
- Se cuentan las coapariciones de cada pareja no ordenada de números.
- La puntuación de una combinación es la suma de las frecuencias de sus 15 parejas.
- La primera combinación maximiza esa puntuación.
- La segunda maximiza la misma puntuación, con un máximo de tres números compartidos con la primera.
- No se pondera la antigüedad de los sorteos ni se mezclan otros métodos.

## Evaluación
El backtest es cronológico: para cada sorteo evaluado, las parejas se calculan solo con sorteos anteriores. Se registran por separado los aciertos de las dos combinaciones. Las métricas retrospectivas describen el comportamiento histórico y no garantizan resultados futuros.

## Límites
Las frecuencias históricas describen coapariciones observadas. No demuestran que una pareja o combinación tenga mayor probabilidad en un sorteo futuro. No se promete capacidad predictiva ni premios.
