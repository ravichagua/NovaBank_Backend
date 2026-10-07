import crypto from "crypto";

const bloqueoFindUnique = jest.fn();
const bloqueoUpsert = jest.fn();
const bloqueoUpdate = jest.fn();
const bloqueoDeleteMany = jest.fn();
const emailOtpUpdateMany = jest.fn();
const emailOtpCreate = jest.fn();
const emailOtpFindFirst = jest.fn();
const emailOtpUpdate = jest.fn();
const enviarCorreo = jest.fn();

jest.mock("../../libreria/prisma", () => ({
  prisma: {
    bloqueoOtp: {
      findUnique: bloqueoFindUnique,
      upsert: bloqueoUpsert,
      update: bloqueoUpdate,
      deleteMany: bloqueoDeleteMany,
    },
    emailOtp: {
      updateMany: emailOtpUpdateMany,
      create: emailOtpCreate,
      findFirst: emailOtpFindFirst,
      update: emailOtpUpdate,
    },
  },
}));
jest.mock("./correo", () => ({ enviarCorreo }));
jest.mock("../../configuracion/entorno", () => ({
  env: { publicBaseUrl: "https://api.test" },
}));

import {
  solicitarOtpRegistro,
  verificarOtpRegistro,
  verificarOtpRegistroPrevio,
} from "./otp.servicio";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

describe("servicio OTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bloqueoFindUnique.mockResolvedValue(null);
    bloqueoUpsert.mockResolvedValue({ intentos: 1 });
    bloqueoDeleteMany.mockResolvedValue({});
    emailOtpUpdateMany.mockResolvedValue({});
    emailOtpCreate.mockResolvedValue({});
    emailOtpUpdate.mockResolvedValue({});
  });

  it("solicita un código y envía el correo", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    await expect(solicitarOtpRegistro("user@example.com")).resolves.toBeUndefined();

    expect(emailOtpCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "user@example.com",
        purpose: "REGISTER",
        codeHash: hash("100000"),
      }),
    });
    expect(enviarCorreo).toHaveBeenCalledWith(
      "user@example.com",
      expect.any(String),
      expect.stringContaining("Vence en 30 minutos")
    );
    randomSpy.mockRestore();
  });

  it("rechaza la verificación cuando no existe un código válido", async () => {
    emailOtpFindFirst.mockResolvedValue(null);

    await expect(verificarOtpRegistro("user@example.com", "100000"))
      .rejects.toMatchObject({ status: 400 });
  });

  it("rechaza un código incorrecto y registra el intento", async () => {
    emailOtpFindFirst.mockResolvedValue({
      id: "otp-1",
      attempts: 0,
      codeHash: hash("999999"),
    });

    await expect(verificarOtpRegistro("user@example.com", "100000"))
      .rejects.toMatchObject({ status: 400, message: "Código incorrecto" });
    expect(emailOtpUpdate).toHaveBeenCalledWith({
      where: { id: "otp-1" },
      data: { attempts: 1 },
    });
    expect(bloqueoUpsert).toHaveBeenCalled();
  });

  it("consume un código correcto y permite la verificación previa sin consumirlo", async () => {
    emailOtpFindFirst.mockResolvedValue({
      id: "otp-1",
      attempts: 0,
      codeHash: hash("100000"),
    });

    await verificarOtpRegistro("user@example.com", "100000");
    expect(emailOtpUpdate).toHaveBeenCalledWith({
      where: { id: "otp-1" },
      data: { consumedAt: expect.any(Date) },
    });

    emailOtpUpdate.mockClear();
    await verificarOtpRegistroPrevio("user@example.com", "100000");
    expect(emailOtpUpdate).not.toHaveBeenCalled();
  });

  it("rechaza un código bloqueado temporalmente", async () => {
    bloqueoFindUnique.mockResolvedValue({ bloqueadoHasta: new Date(Date.now() + 60_000) });

    await expect(verificarOtpRegistro("user@example.com", "100000"))
      .rejects.toMatchObject({ status: 429 });
    expect(emailOtpFindFirst).not.toHaveBeenCalled();
  });

  it("rechaza códigos que agotaron sus intentos", async () => {
    emailOtpFindFirst.mockResolvedValue({
      id: "otp-1",
      attempts: 5,
      codeHash: hash("100000"),
    });

    await expect(verificarOtpRegistro("user@example.com", "100000"))
      .rejects.toMatchObject({ status: 429 });
    expect(emailOtpUpdate).toHaveBeenCalledWith({
      where: { id: "otp-1" },
      data: { consumedAt: expect.any(Date) },
    });
  });
});
