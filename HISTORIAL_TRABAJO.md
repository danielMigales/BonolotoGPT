# Historial de trabajo — BonolotoGPT
Última revisión: 19 de octubre de 2026.

## Decisiones vigentes
- El proyecto se dedica exclusivamente a Bonoloto.
- La combinación analizada contiene únicamente seis números principales distintos entre 1 y 49.
- El único objetivo es acertar los seis números. No existen métricas, prioridades, pesos, predicciones ni seguimiento para campos auxiliares.
- El histórico normalizado contiene resultados desde el 1 de enero de 2026; su integridad se comprueba por calendario y por contraste agregado de frecuencias SELAE.
- La ventana pública del Laboratorio IA es fija en 15 sorteos.
- La aplicación requiere 16 sorteos para evaluar la primera predicción.
- El importador usa el calendario diario configurado en `scripts/update_data.py`; cualquier cambio de calendario debe reflejarse también en las pruebas.
- No se declara completada una tarea hasta ejecutar pruebas y revisar la publicación.

## Limpieza aplicada
- Modelo actualizado a 2.1.0, con seguimiento únicamente de aciertos sobre seis números.
- Eliminada la interfaz y la lógica del laboratorio asociada a campos auxiliares.
- El importador normaliza cada resultado a identificador, fecha, seis números y fuente oficial.
- Se eliminan archivos brutos e informes obsoletos.
- El Worker utiliza el prefijo `bonoloto/` para que el histórico y las cachés heredadas no se lean como datos actuales.
- La documentación técnica describe únicamente las reglas de Bonoloto.

## Pendiente
- Confirmar la descarga individual desde SELAE para cada fecha: el contraste de frecuencias valida el tramo agregado, no demuestra que cada registro haya sido verificado individualmente.
- Revisar que la ejecución diaria posterior a las 23:00 de Madrid se complete correctamente.
- No se deben crear sorteos de ejemplo ni presentar datos auxiliares como números principales.
