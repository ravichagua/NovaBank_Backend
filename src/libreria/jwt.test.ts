import jwt from "jsonwebtoken";
import {
  firmarTokenAcceso,
  generarTokenRefresco,
  hashearToken,
  ttlRefrescoAFecha,
  verifyAccessToken,
} from "./jwt";

describe("JWT y tokens de refresco", () => {
  it("firma y verifica un token de acceso", () => {
    const payload = { sub: "usuario-1", email: "user@example.com" };
    const token = firmarTokenAcceso(payload);

    expect(verifyAccessToken(token)).toMatchObject(payload);
  });

  it("rechaza un token inválido", () => {
    expect(() => verifyAccessToken("token-invalido")).toThrow();
  });

  it("genera tokens de refresco no vacíos y hashes deterministas", () => {
    const token = generarTokenRefresco();

    expect(token).toHaveLength(128);
    expect(hashearToken(token)).toBe(hashearToken(token));
    expect(hashearToken(token)).not.toBe(hashearToken(generarTokenRefresco()));
  });

  it("calcula una fecha futura para el TTL configurado", () => {
    const ahora = Date.now();
    const fecha = ttlRefrescoAFecha();

    expect(fecha.getTime()).toBeGreaterThan(ahora);
  });

  it("rechaza tokens con firma incorrecta", () => {
    const token = jwt.sign({ sub: "x", email: "x@example.com" }, "otra-clave");

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
