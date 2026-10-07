import { esquemaLogin, esquemaRegistro } from "./autenticacion.validadores";

describe("validadores de autenticación", () => {
  it("normaliza los datos válidos de registro", () => {
    const resultado = esquemaRegistro.parse({
      email: "  USER@EXAMPLE.COM ",
      password: "ClaveSegura123",
      fullName: " Usuario de Prueba ",
      otpCode: "123456",
    });

    expect(resultado.email).toBe("user@example.com");
    expect(resultado.fullName).toBe("Usuario de Prueba");
  });

  it("rechaza un registro con OTP inválido", () => {
    expect(
      esquemaRegistro.safeParse({
        email: "user@example.com",
        password: "ClaveSegura123",
        fullName: "Usuario",
        otpCode: "123",
      }).success
    ).toBe(false);
  });

  it("normaliza un email válido de login", () => {
    expect(esquemaLogin.parse({ email: " USER@example.com ", password: "x" }).email).toBe("user@example.com");
  });

  it("rechaza credenciales inválidas", () => {
    expect(esquemaLogin.safeParse({ email: "no-es-email", password: "" }).success).toBe(false);
  });
});
