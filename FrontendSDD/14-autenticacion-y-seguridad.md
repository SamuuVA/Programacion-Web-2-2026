# 14 — Autenticación y seguridad
Seguir el mecanismo de sesión real del backend; no asumir JWT, cookies o proveedor. Rutas privadas requieren sesión. Rol controla presentación, pero backend valida rol, estado, ownership y scope en cada operación. 401 y 403 deben tratarse diferenciadamente. No guardar credenciales/tokens de forma insegura ni registrar datos sensibles.
