import { AuditCategory, Prisma } from "@prisma/client";
import { prisma } from "../../libreria/prisma";
import type { MetaSolicitud } from "../../libreria/metaSolicitud";

export interface RecordAuditInput {
  userId?: string | null;
  category: AuditCategory;
  action: string;
  success?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
  screen?: string;
  meta?: MetaSolicitud;
}

// Se llama desde dentro del servicio que ejecuta la acción (transferencias,
// pagos de recibo, retiros, eventos de sesión/login, cambios de
// perfil/seguridad, ...) justo después de que tenga éxito o falle — nunca
// bloquea ni hace fallar la operación de fondo: una escritura de auditoría
// rota no debe tumbar una solicitud real de movimiento de dinero, así que
// los errores aquí solo se registran en el log.
export async function registrarAuditoria(entrada: RecordAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entrada.userId ?? null,
        category: entrada.category,
        action: entrada.action,
        success: entrada.success ?? true,
        description: entrada.description,
        metadata: entrada.metadata as Prisma.InputJsonValue | undefined,
        screen: entrada.screen,
        ip: entrada.meta?.ip,
        country: entrada.meta?.country,
        city: entrada.meta?.city,
        device: entrada.meta?.device,
        platform: entrada.meta?.platform,
        appVersion: entrada.meta?.appVersion,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar la auditoría", entrada.action, error);
  }
}


