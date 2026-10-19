# Historial de trabajo — BonolotoGPT
Última revisión: 19 de octubre de 2026.

## Decisiones vigentes
- El proyecto se dedica exclusivamente a Bonoloto.
- La combinación analizada contiene únicamente seis números principales distintos entre 1 y 49.
- El único objetivo es acertar los seis números. No existen métricas, prioridades, pesos, predicciones ni seguimiento para campos auxiliares.
- El histórico normalizado se mantiene vacío hasta obtener datos oficiales válidos.
- La ventana pública del Laboratorio IA es fija en 15 sorteos.
- La aplicación requiere 16 sorteos para evaluar la primera predicción.
- Bonoloto se trata como un calendario de lunes a sábado; se excluyen los domingos.
- No se declara completada una tarea hasta ejecutar pruebas y revisar la publicación.

## Limpieza aplicada
- Modelo actualizado a 2.1.0, con seguimiento únicamente de aciertos sobre seis números.
- Eliminada la interfaz y la lógica del laboratorio asociada a campos auxiliares.
- El importador normaliza cada resultado a identificador, fecha, seis números y fuente oficial.
- Se eliminan archivos brutos e informes obsoletos.
- El Worker utiliza el prefijo `bonoloto/` para que el histórico y las cachés heredadas no se lean como datos actuales.
- La documentación técnica describe únicamente las reglas de Bonoloto.

## Pendiente
- Ejecutar las pruebas y la construcción tras la limpieza.
- Esperar datos oficiales reales; no se deben crear sorteos de ejemplo en producción.
- Confirmar un workflow exitoso y la publicación.
