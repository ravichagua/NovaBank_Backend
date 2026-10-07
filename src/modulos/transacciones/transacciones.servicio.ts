import { Prisma, TransactionCategory, TransactionKind } from "@prisma/client";
import { prisma } from "../../libreria/prisma";

type Db = typeof prisma | Prisma.TransactionClient;

export type NuevaEntradaTransaccion = {
  kind: TransactionKind;
  category: TransactionCategory;
  name: string;
  meta: string;
  amount: number;
  icon: string;
  iconBg: string;
  iconFg: string;
};

export async function registrarTransaccion(
  db: Db,
  _idUsuario: string,
  idCuenta: string,
  entrada: NuevaEntradaTransaccion
) {
  const transaccion = await db.transaction.create({
    data: {
      accountId: idCuenta,
      kind: entrada.kind,
      category: entrada.category,
      name: entrada.name,
      meta: entrada.meta,
      amount: entrada.amount,
      icon: entrada.icon,
      iconBg: entrada.iconBg,
      iconFg: entrada.iconFg,
    },
  });
  return transaccion;
}

export async function listarTransacciones(idUsuario: string, limite = 50) {
  const cuenta = await prisma.account.findUnique({ where: { userId: idUsuario } });
  if (!cuenta) return [];

  const elementos = await prisma.transaction.findMany({
    where: { accountId: cuenta.id },
    orderBy: { createdAt: "desc" },
    take: limite,
  });

  return elementos.map((t) => ({
    id: t.id,
    name: t.name,
    meta: t.meta,
    amount: Number(t.amount),
    kind: t.kind.toLowerCase() as "credit" | "debit",
    category: t.category.toLowerCase(),
    icon: t.icon,
    iconBg: t.iconBg,
    iconFg: t.iconFg,
    createdAt: t.createdAt,
  }));
}
