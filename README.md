# BonolotoGPT — versión mínima

La web muestra únicamente los 10 sorteos más recientes de Bonoloto y resalta los números principales que aparecen en más de un sorteo de esa ventana.

- Fuente de resultados: página oficial de [Loterías y Apuestas del Estado (SELAE)](https://www.loteriasyapuestas.es/es/bonoloto/resultados).
- Los números repetidos se calculan sobre los seis números principales; complementario y reintegro se muestran aparte.
- Actualización automática diaria mediante GitHub Actions y también manual desde **Actions → Actualizar y publicar Bonoloto**.
- Si la fuente oficial no puede leerse o no se obtienen 10 sorteos válidos, la actualización falla sin sustituir los datos existentes por datos incompletos.

No genera predicciones ni afirma que las repeticiones permitan predecir futuros resultados.
