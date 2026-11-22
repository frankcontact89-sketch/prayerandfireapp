# Diagnóstico (solo lectura) — community-push / TURN

- Backend: Lovable Cloud, ref yufzlqcuvmirniruwyio (una instancia para preview y producción).
- La función community-push existe en este proyecto (commit b245aa7), pero solo envía push APNs/FCM. No tiene lógica ICE/TURN.
- Secretos: TURN_URLS y TURN_SHARED_SECRET NO existen. Tampoco APNS_* ni FCM_SERVER_KEY.
- Logs: disponibles; solo muestran arranque y apagado, sin peticiones reales.
- Servidor TURN real: ninguno configurado.

## Bloqueos
1. El commit 469919c (fix/prayer-voice) no está en este proyecto. Las funciones se despliegan solas desde el código del proyecto; no hay despliegue manual desde una rama de GitHub.
2. Faltan TURN_URLS y TURN_SHARED_SECRET, más un servidor TURN real (coturn o un proveedor).

## Mecanismo seguro (si lo apruebas)
1. Fusionar solo supabase/functions/community-push de 469919c en la rama main conectada.
2. Añadir los dos secretos en Project Settings → Secrets.
3. Probar la función sin tocar la base de datos.
