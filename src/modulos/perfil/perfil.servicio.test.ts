const userFindUniqueOrThrow = jest.fn();
const userFindUnique = jest.fn();
const userUpdate = jest.fn();

jest.mock("../../libreria/prisma", () => ({
  prisma: {
    user: { findUniqueOrThrow: userFindUniqueOrThrow, findUnique: userFindUnique, update: userUpdate },
  },
}));
jest.mock("../verificacion/otp.servicio", () => ({
  solicitarOtpPerfil: jest.fn(),
  verificarOtpPerfil: jest.fn(),
}));
jest.mock("../auditoria/auditoria.servicio", () => ({ registrarAuditoria: jest.fn() }));

import {
  actualizarContrasena,
  actualizarCorreo,
  actualizarTelefono,
  solicitarOtpPerfil,
} from "./perfil.servicio";

const usuario = {
  id: "user-1",
  email: "old@example.com",
  fullName: "Usuario",
  phone: "987654321",
  dni: null,
  passwordHash: "$2b$04$abcdefghijklmnopqrstuuV8T4vYvW7lM7yXjVh7XhYp6t7q8r9s0",
};

describe("servicio de perfil", () => {
  beforeEach(() => jest.clearAllMocks());

  it("solicita un OTP para el correo actual", async () => {
    userFindUniqueOrThrow.mockResolvedValue(usuario);

    await expect(solicitarOtpPerfil("user-1")).resolves.toBeUndefined();
  });

  it("rechaza actualizar al mismo correo o a uno ocupado", async () => {
    userFindUniqueOrThrow.mockResolvedValue(usuario);
    userFindUnique.mockResolvedValue({ id: "other" });

    await expect(actualizarCorreo("user-1", { newEmail: "old@example.com", otpCode: "123456" }))
      .rejects.toMatchObject({ status: 400 });
    await expect(actualizarCorreo("user-1", { newEmail: "new@example.com", otpCode: "123456" }))
      .rejects.toMatchObject({ status: 409 });
  });

  it("actualiza correo y teléfono disponibles", async () => {
    userFindUniqueOrThrow.mockResolvedValue(usuario);
    userFindUnique.mockResolvedValue(null);
    userUpdate.mockResolvedValue({ ...usuario, email: "new@example.com", phone: "912345678" });

    await expect(actualizarCorreo("user-1", { newEmail: "new@example.com", otpCode: "123456" }))
      .resolves.toMatchObject({ email: "new@example.com" });
    await expect(actualizarTelefono("user-1", { newPhone: "912345678", otpCode: "123456" }))
      .resolves.toMatchObject({ phone: "912345678" });
  });

  it("rechaza la contraseña actual incorrecta", async () => {
    userFindUniqueOrThrow.mockResolvedValue(usuario);

    await expect(actualizarContrasena("user-1", {
      currentPassword: "incorrecta",
      newPassword: "ClaveSegura123",
      otpCode: "123456",
    })).rejects.toMatchObject({ status: 401 });
  });
});
