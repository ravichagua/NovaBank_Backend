import express from "express";
import path from "path";
import { applySecurityMiddleware } from "./intermediarios/seguridad";
import { generalLimiter } from "./intermediarios/limiteTasa";
import { errorHandler, notFoundHandler } from "./intermediarios/manejadorErrores";
import { healthRouter } from "./modulos/salud/salud.rutas";
import { authRouter } from "./modulos/autenticacion/autenticacion.rutas";
import { dniRouter } from "./modulos/dni/dni.rutas";
import { verificationRouter } from "./modulos/verificacion/verificacion.rutas";
import { accountRouter } from "./modulos/cuenta/cuenta.rutas";
import { transactionsRouter } from "./modulos/transacciones/transacciones.rutas";
import { profileRouter } from "./modulos/perfil/perfil.rutas";

export function crearApp() {
  const app = express();

  applySecurityMiddleware(app);
  // 8mb cubre un par selfie + foto de DNI en base64 para la verificación facial
  app.use(express.json({ limit: "8mb" }));
  app.use(generalLimiter);

  // Público y de solo lectura (logo y afines para incrustar en correos)
  app.use("/assets", express.static(path.join(__dirname, "assets")));

  app.use(healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/dni", dniRouter);
  app.use("/api/verification", verificationRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/profile", profileRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
