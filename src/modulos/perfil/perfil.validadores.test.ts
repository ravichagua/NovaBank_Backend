import {
  esquemaActualizarContrasena,
  esquemaActualizarCorreo,
  esquemaActualizarTelefono,
} from "./perfil.validadores";

describe("validadores de perfil", () => {
  it("valida la actualización de correo", () => {
    expect(
      esquemaActualizarCorreo.parse({ newEmail: "NEW@EXAMPLE.COM", otpCode: "123456" })
    ).toEqual({ newEmail: "new@example.com", otpCode: "123456" });
  });

  it("rechaza teléfono y OTP inválidos", () => {
    expect(esquemaActualizarTelefono.safeParse({ newPhone: "123", otpCode: "x" }).success).toBe(false);
  });

  it("valida el cambio de contraseña", () => {
    expect(
      esquemaActualizarContrasena.safeParse({
        currentPassword: "actual",
        newPassword: "ClaveSegura123",
        otpCode: "123456",
      }).success
    ).toBe(true);
  });
});
