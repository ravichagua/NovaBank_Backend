const auditCreate = jest.fn();

jest.mock("../../libreria/prisma", () => ({
  prisma: { auditLog: { create: auditCreate } },
}));

import { registrarAuditoria } from "./auditoria.servicio";

describe("servicio de auditoría", () => {
  beforeEach(() => jest.clearAllMocks());

  it("guarda la auditoría con metadatos de solicitud", async () => {
    auditCreate.mockResolvedValue({});

    await registrarAuditoria({
      userId: "user-1",
      category: "AUTH" as never,
      action: "LOGIN",
      meta: { ip: "127.0.0.1", country: "PE", city: "Lima", device: "Phone" },
    });

    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        action: "LOGIN",
        success: true,
        ip: "127.0.0.1",
        country: "PE",
        city: "Lima",
      }),
    });
  });

  it("no propaga errores de persistencia", async () => {
    auditCreate.mockRejectedValue(new Error("database unavailable"));
    const originalConsoleError = console.error;
    console.error = jest.fn();

    await expect(
      registrarAuditoria({ category: "AUTH" as never, action: "FAIL" })
    ).resolves.toBeUndefined();

    console.error = originalConsoleError;
  });
});
