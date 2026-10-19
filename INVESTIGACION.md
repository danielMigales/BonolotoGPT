# Investigación de métodos para PrimitivaGPT

Consulta de fuentes: 18/10/2026. Aplicación experimental: modelo 1.2.0.

## Conclusión

Se incorporan dos expertos conservadores —Bayes regularizado y Markov regularizado— y aprendizaje del reintegro por pérdida de Brier. Son técnicas estadísticas generales: las fuentes no demuestran que puedan predecir La Primitiva ni garantizar premios. La muestra disponible contiene 125 sorteos; comparar muchas variantes sobre el mismo archivo produce evidencia exploratoria, no validación independiente.

## Métodos estudiados y decisión

| Método | Qué aporta | Decisión |
| --- | --- | --- |
| Frecuencia y recencia | Descripción de apariciones y cambios recientes | Ya disponible; se conserva como referencia |
| Bayes con prior simétrico | Reduce la confianza en fluctuaciones pequeñas | Añadido con regularización fuerte |
| Transiciones de Markov | Comprueba si un estado anterior aporta información sobre el siguiente | Añadido como hipótesis experimental, con suavizado fuerte |
| Agregación de expertos | Combina distribuciones y ajusta pesos tras conocer cada resultado | Ampliada de cinco a siete métodos |
| Brier y pérdida logarítmica | Evalúan la distribución completa del reintegro | Añadidas; Brier guía sus pesos |
| Redes neuronales, LSTM, Transformer y bosques | Modelos de mayor capacidad para relaciones complejas | No integrados en esta versión; con 125 eventos independientes de reintegro, mi criterio es priorizar modelos pequeños antes de ampliar la complejidad |
| Auditoría de aleatoriedad | Contrasta el histórico con un mecanismo aleatorio | Referencia conceptual; no se interpreta una pareja frecuente como señal predictiva demostrada |

## Fuentes primarias y alcance

1. **Stanford CS228 — Bayesian Learning.** Explica aprendizaje bayesiano, priors conjugados y pseudocuentas. Sustenta el suavizado, no una ventaja en loterías. Para el reintegro se usa una distribución categórica con prior Dirichlet simétrico de diez pseudocuentas por categoría. Para los seis números, las pseudocuentas generan puntuaciones regularizadas; no se presentan como probabilidades calibradas de inclusión.
   https://ermongroup.github.io/cs228-notes/learning/bayesian/

2. **Vovk y Zhdanov (2009), Prediction With Expert Advice For The Brier Game, JMLR 10:2445–2471.** Estudia agregación de expertos con pérdida de Brier y aplicaciones deportivas. Nuestra actualización exponencial está inspirada en ese marco general; no reproduce su algoritmo óptimo ni hereda automáticamente sus garantías. Se usa Brier multiclase sin dividir entre dos: el uniforme sobre diez reintegros tiene error 0,9.
   https://www.jmlr.org/papers/v10/vovk09a.html

3. **scikit-learn — Probability calibration.** Distingue calidad probabilística, discriminación y calibración. Brier menor no demuestra por sí solo mejor calibración. Se registra también pérdida logarítmica; el uniforme tiene referencia ln(10). No se ajusta un calibrador isotónico sobre toda la muestra para evaluar luego esa misma muestra.
   https://scikit-learn.org/stable/modules/calibration.html

4. **scikit-learn — TimeSeriesSplit.** Advierte sobre entrenar con futuro y evaluar pasado. El motor conserva una evaluación secuencial en orden de sorteos, sin barajar. Nuestra unidad temporal es el índice de sorteo; no se exige que transcurra el mismo número de días entre eventos. El diseño del modelo se ha desarrollado sobre un histórico ya examinado, por lo que la validación prospectiva real requiere nuevos sorteos.
   https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html

5. **Coronel-Brizio et al. (2008), Statistical auditing and randomness test of lotto k/N-type games.** Presenta una auditoría basada en la distribución hipergeométrica, con aplicaciones históricas y comparación Monte Carlo. Detectar desviaciones estadísticas y obtener capacidad predictiva fuera de muestra son cuestiones distintas; el artículo no demuestra que nuestro motor prediga La Primitiva.
   https://arxiv.org/abs/0806.4595

6. **John Haigh (1997), The Statistics of the National Lottery.** El resumen informa que las primeras 96 extracciones británicas estudiadas eran compatibles con el azar en frecuencias y tiempos de espera. Es evidencia de ese estudio, no certificación de todas las loterías.
   https://rss.onlinelibrary.wiley.com/doi/abs/10.1111/1467-985X.00056

7. **vietvudanh/vietlott-data — Markov strategy.** Código primario de un experimento abierto que describe transiciones entre sorteos y reconoce que no existiría dependencia de primer orden en una lotería justa. Sirve de ejemplo de la hipótesis, no de evidencia de ganancias. La implementación de PrimitivaGPT es propia y simplificada: para reintegro cuenta transiciones desde el último dígito; para números agrega transiciones desde los seis valores del último sorteo. Todas las transiciones usan únicamente el pasado.
   https://github.com/vietvudanh/vietlott-data/blob/main/src/machine_learning/strategies/markov_chain.py

## Protocolo de combinación

Los siete expertos comienzan con el mismo peso. Los modelos de números y reintegro siguen separados. Para reintegro, después del resultado se actualiza el peso exponencial según la pérdida Brier de las diez categorías; el conteo de aciertos continúa siendo el criterio principal visible. Para números se conserva la actualización por aciertos y objetivo de tres o más. Los parámetros de suavizado y aprendizaje son fijos en esta versión; no se buscaron hasta encontrar una combinación ganadora del pasado.

La referencia 1.1.0 se reproduce con sus cinco expertos y su regla previa sobre las mismas fechas y el mismo número de boletos. Se conserva también el control aleatorio. Las ventanas 20, 30 y 50 son experimentos solapados: no se suman como observaciones independientes ni se elige la ventana de 50 como predicción ganadora porque produjo un caso favorable en el histórico.

## Resultados observados

| Iniciales | Pruebas | R. versión 1.1 | R. versión 1.2 | Brier 1.1 | Brier 1.2 | Brier uniforme | 3+ y R. 1.2 | 3+ y R. azar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | 105 | 8 | 9 | 0,9095 | 0,9032 | 0,9 | 0 | 1 |
| 30 | 95 | 8 | 8 | 0,9078 | 0,9024 | 0,9 | 0 | 1 |
| 50 | 75 | 6 | 6 | 0,9086 | 0,9046 | 0,9 | 1 | 1 |

El error Brier disminuye frente a la versión anterior, pero el uniforme sigue obteniendo menor pérdida. La ventana por defecto mantiene los mismos reintegros acertados. No se declara una ventaja predictiva. Las primeras propuestas emitidas quedan registradas por versión, ventana y fecha de entrenamiento para poder contrastarlas con sorteos futuros sin reescribirlas.
