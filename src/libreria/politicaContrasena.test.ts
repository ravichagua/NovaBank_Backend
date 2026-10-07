import { esquemaContrasena } from "./politicaContrasena";

describe("política de contraseñas", () => {
  it("acepta una contraseña fuerte", () => {
    expect(esquemaContrasena.parse("ClaveSegura123")).toBe("ClaveSegura123");
  });

  it.each(["corta1A", "sinmayuscula123", "SINMINUSCULA123", "SinNumeroClave"])(
    "rechaza una contraseña débil: %s",
    (password) => {
      expect(esquemaContrasena.safeParse(password).success).toBe(false);
    }
  );
});
