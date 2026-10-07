const transactionCreate = jest.fn();
const accountFindUnique = jest.fn();
const transactionFindMany = jest.fn();

jest.mock("../../libreria/prisma", () => ({
  prisma: {
    transaction: { create: transactionCreate, findMany: transactionFindMany },
    account: { findUnique: accountFindUnique },
  },
}));

import { listarTransacciones, registrarTransaccion } from "./transacciones.servicio";

describe("servicio de transacciones", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registra una transacción con los datos de entrada", async () => {
    const creada = { id: "tx-1" };
    transactionCreate.mockResolvedValue(creada);

    await expect(
      registrarTransaccion(
        { transaction: { create: transactionCreate } } as never,
        "user-1",
        "account-1",
        {
          kind: "CREDIT" as never,
          category: "SALARY" as never,
          name: "Depósito",
          meta: "Prueba",
          amount: 100,
          icon: "plus",
          iconBg: "#fff",
          iconFg: "#000",
        }
      )
    ).resolves.toBe(creada);

    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ accountId: "account-1", amount: 100 }),
    });
  });

  it("devuelve una lista vacía si el usuario no tiene cuenta", async () => {
    accountFindUnique.mockResolvedValue(null);

    await expect(listarTransacciones("user-1")).resolves.toEqual([]);
    expect(transactionFindMany).not.toHaveBeenCalled();
  });

  it("mapea cantidades y enums de las transacciones", async () => {
    accountFindUnique.mockResolvedValue({ id: "account-1" });
    transactionFindMany.mockResolvedValue([
      {
        id: "tx-1",
        name: "Compra",
        meta: "Tienda",
        amount: { toString: () => "12.5" },
        kind: "DEBIT",
        category: "SHOPPING",
        icon: "cart",
        iconBg: "#fff",
        iconFg: "#000",
        createdAt: new Date("2026-01-01"),
      },
    ]);

    await expect(listarTransacciones("user-1", 10)).resolves.toEqual([
      expect.objectContaining({ id: "tx-1", amount: 12.5, kind: "debit", category: "shopping" }),
    ]);
    expect(transactionFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
  });
});
