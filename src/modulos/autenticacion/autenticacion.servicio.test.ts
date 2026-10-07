const userFindUnique = jest.fn();
const loginEventCreate = jest.fn();
const userUpdate = jest.fn();
const refreshFindUnique = jest.fn();
const refreshUpdateMany = jest.fn();

jest.mock("../../libreria/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    loginEvent: { create: loginEventCreate },
    refreshToken: {
      findUnique: refreshFindUnique,
      updateMany: refreshUpdateMany,
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../verificacion/otp.servicio", () => ({
  solicitarOtpRestablecerContrasena: jest.fn(),
  verificarOtpRestablecerContrasena: jest.fn(),
  verificarOtpRegistro: jest.fn(),
}));
jest.mock("../cuenta/cuenta.servicio", () => ({ crearCuentaParaUsuario: jest.fn() }));
jest.mock("../verificacion/rostro.servicio", () => ({ compareFaces: jest.fn() }));
jest.mock("../../libreria/cloudinary", () => ({ subirReferenciaFacial: jest.fn() }));
jest.mock("../auditoria/auditoria.servicio", () => ({ registrarAuditoria: jest.fn() }));

import {
  cerrarSesion,
  iniciarSesion,
  iniciarSesionConRostro,
  refrescarSesion,
  solicitarRestablecerContrasena,
} from "./autenticacion.servicio";

const meta = { ip: "127.0.0.1", userAgent: "Jest" };

describe("servicio de autenticación", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rechaza login con un correo inexistente y registra el intento", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(iniciarSesion({ email: "missing@example.com", password: "x" }, meta)).rejects.toMatchObject({
      status: 401,
    });
    expect(loginEventCreate).toHaveBeenCalled();
  });

  it("rechaza login de una cuenta inactiva", async () => {
    userFindUnique.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      isActive: false,
      lockedUntil: null,
    });

    await expect(iniciarSesion({ email: "user@example.com", password: "x" }, meta)).rejects.toMatchObject({
      status: 403,
      message: "Cuenta inactiva",
    });
  });

  it("rechaza login facial sin referencia configurada", async () => {
    userFindUnique.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      isActive: true,
      lockedUntil: null,
      faceReference: null,
    });

    await expect(
      iniciarSesionConRostro({ email: "user@example.com", selfie: "a".repeat(100) }, meta)
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rechaza refresh inexistente o expirado", async () => {
    refreshFindUnique.mockResolvedValue(null);

    await expect(refrescarSesion("token-inexistente", meta)).rejects.toMatchObject({ status: 401 });
  });

  it("rechaza recuperación para una cuenta no disponible", async () => {
    userFindUnique.mockResolvedValue({ isActive: false });

    await expect(
      solicitarRestablecerContrasena({ email: "inactive@example.com" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("revoca un refresh token al cerrar sesión", async () => {
    refreshFindUnique.mockResolvedValue({ userId: "u1" });

    await expect(cerrarSesion("token", meta)).resolves.toBeUndefined();
    expect(refreshUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ revokedAt: null }) })
    );
  });
});
