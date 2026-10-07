const accountCreate = jest.fn();
const accountFindUnique = jest.fn();
const accountUpdate = jest.fn();
const userFindUniqueOrThrow = jest.fn();
const transaction = jest.fn();

jest.mock("../../libreria/prisma", () => ({
  prisma: {
    account: { create: accountCreate, findUnique: accountFindUnique, update: accountUpdate },
    user: { findUniqueOrThrow: userFindUniqueOrThrow },
    $transaction: transaction,
  },
}));
jest.mock("../verificacion/otp.servicio", () => ({ verificarOtpPerfil: jest.fn() }));
jest.mock("../auditoria/auditoria.servicio", () => ({ registrarAuditoria: jest.fn() }));
jest.mock("../transacciones/transacciones.servicio", () => ({ registrarTransaccion: jest.fn() }));

import {
  crearCuentaParaUsuario,
  establecerBloqueoTarjeta,
  obtenerResumenCuenta,
  pagarTarjeta,
  revelarCvv,
} from "./cuenta.servicio";
import { cifrar } from "../../libreria/criptografia";

const cuenta = {
  id: "account-1",
  accountNumber: "191-1234-5678",
  cci: "002-191-12345678901-12",
  cardNumber: cifrar("4111111111111111"),
  cardCvv: cifrar("123"),
  cardExpiry: "01/30",
  availableBalance: 100,
  heldBalance: 0,
  creditLine: 1500,
  cardDebt: 50,
  cutDay: 10,
  cardBlocked: false,
  createdAt: new Date("2025-01-01"),
};

describe("servicio de cuentas", () => {
  beforeEach(() => jest.clearAllMocks());

  it("crea una cuenta con datos cifrados", async () => {
    accountCreate.mockResolvedValue({ id: "account-1" });

    await expect(crearCuentaParaUsuario({ account: { create: accountCreate } } as never, "user-1"))
      .resolves.toEqual({ id: "account-1" });

    expect(accountCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        creditLine: 1500,
        cardNumber: expect.any(String),
        cardCvv: expect.any(String),
      }),
    });
  });

  it("devuelve el resumen descifrando la tarjeta", async () => {
    accountFindUnique.mockResolvedValue(cuenta);

    await expect(obtenerResumenCuenta("user-1")).resolves.toEqual(
      expect.objectContaining({ cardNumber: "4111111111111111", minPayment: 20, cardDebt: 50 })
    );
  });

  it("rechaza una cuenta inexistente", async () => {
    accountFindUnique.mockResolvedValue(null);

    await expect(obtenerResumenCuenta("missing")).rejects.toMatchObject({ status: 404 });
  });

  it("bloquea o desbloquea una tarjeta", async () => {
    accountFindUnique.mockResolvedValue(cuenta);
    accountUpdate.mockResolvedValue({ cardBlocked: true });

    await expect(establecerBloqueoTarjeta("user-1", true)).resolves.toBe(true);
    expect(accountUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { cardBlocked: true } }));
  });

  it("rechaza pagos inválidos o superiores a la deuda", async () => {
    accountFindUnique.mockResolvedValue(cuenta);

    await expect(pagarTarjeta("user-1", 0)).rejects.toMatchObject({ status: 400 });
    await expect(pagarTarjeta("user-1", 100)).rejects.toMatchObject({ status: 400 });
  });

  it("revela el CVV después de verificar el OTP", async () => {
    userFindUniqueOrThrow.mockResolvedValue({ email: "user@example.com" });
    accountFindUnique.mockResolvedValue(cuenta);

    await expect(revelarCvv("user-1", "123456")).resolves.toEqual({ cvv: "123" });
  });
});
