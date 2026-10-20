# Activar «Actualizar sorteos» en producción

La rama `fix/real-refresh-trigger` conecta el botón de GitHub Pages con el endpoint `/api/refresh` del Cloudflare Worker. Antes de publicar estos cambios:

1. En el Worker `bonolotogpt`, configura un **secret** llamado `GH_ACTIONS_TOKEN`. Debe ser un token fine-grained limitado al repositorio `danielMigales/BonolotoGPT`, con permiso de repositorio **Actions: Read and write** y acceso de lectura a Metadata. No pongas el token en el HTML, en GitHub Pages ni en un archivo versionado.
2. Confirma que el Worker tiene el binding R2 `BUCKET` ya usado por el histórico. El endpoint lo utiliza para limitar las solicitudes a una por cada 20 minutos.
3. Despliega el Worker actualizado y publica la rama principal desde GitHub Pages una vez integrados los cambios.
4. Comprueba que el workflow **Publicar BonolotoGPT en GitHub Pages** puede ejecutarse manualmente desde GitHub Actions. El botón solo inicia el workflow; la importación SELAE, las validaciones y la publicación las realiza el workflow existente.
5. Si el botón indica que falta el secreto, que el token fue rechazado o que no se confirmó una nueva publicación, no des por actualizados los datos: revisa la ejecución en Actions.

El endpoint solo acepta el origen `https://danielmigales.github.io`, y el token permanece en el Worker. La restricción de origen no sustituye a la protección contra abuso; el límite persistente en R2 reduce las solicitudes repetidas. No compartas ni pegues el valor del token en el chat.
