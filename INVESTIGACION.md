# Investigación estadística — BonolotoGPT
Revisión: 19 de octubre de 2026. Modelo actual: 2.1.0.

## Objetivo
Evaluar combinaciones formadas por seis números distintos del 1 al 49. La única métrica de acierto es cuántos de los seis números coinciden con el resultado oficial.

## Métodos
El motor combina siete métodos experimentales: azar uniforme, frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas y estructura, Bayes regularizado y Markov regularizado. Los pesos se actualizan después de evaluar cada sorteo, sin usar información del resultado objetivo para generar su predicción.

## Evaluación
- La validación es secuencial: cada sorteo se predice solo con sorteos anteriores.
- La ventana inicial de la interfaz es fija en 15 sorteos.
- La primera evaluación requiere 16 sorteos oficiales.
- Se comparan la media de aciertos y el número de sorteos con tres o más y cuatro o más aciertos frente a una referencia aleatoria reproducible.
- Las frecuencias y coapariciones describen el histórico, pero no demuestran que una combinación futura sea más probable.
- El histórico del repositorio contiene sorteos desde enero de 2026. Las métricas deben interpretarse con cautela: validar frecuencias agregadas no garantiza que cada fila se haya verificado individualmente contra SELAE.

## Límites
En un sorteo justo, todas las combinaciones de seis números tienen la misma probabilidad. Un resultado histórico favorable no demuestra una ventaja predictiva. Las conclusiones deben actualizarse únicamente con datos oficiales y pruebas reproducibles.

## Fuentes metodológicas
- Stanford CS228, aprendizaje bayesiano: https://ermongroup.github.io/cs228-notes/learning/bayesian/
- Vovk y Zhdanov, *Prediction With Expert Advice For The Brier Game*: https://www.jmlr.org/papers/v10/vovk09a.html
- scikit-learn, validación temporal: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html

Estas fuentes explican métodos generales; no prueban que el motor pueda predecir loterías.
