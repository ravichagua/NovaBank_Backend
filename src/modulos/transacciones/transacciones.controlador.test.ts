jest.mock("./transacciones.servicio", () => ({ listarTransacciones: jest.fn() }));

import { manejadorListarTransacciones } from "./transacciones.controlador";
import * as servicio from "./transacciones.servicio";

describe("controlador de transacciones", () => {
  it.each([
    [{ limit: "10" }, 10],
    [{ limit: "999" }, 200],
    [{ limit: "invalido" }, 50],
  ])("aplica el límite %j", async (query, limite) => {
    (servicio.listarTransacciones as jest.Mock).mockResolvedValue([]);
    const res = { json: jest.fn() };

    await manejadorListarTransacciones(
      { query, user: { id: "user-1" } } as never,
      res as never
    );

    expect(servicio.listarTransacciones).toHaveBeenCalledWith("user-1", limite);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });
});
