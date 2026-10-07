jest.mock("./cuenta.servicio", () => ({
  obtenerResumenCuenta: jest.fn(),
  establecerBloqueoTarjeta: jest.fn(),
  pagarTarjeta: jest.fn(),
  revelarCvv: jest.fn(),
}));
jest.mock("../../libreria/metaSolicitud", () => ({ obtenerMetaSolicitud: jest.fn(() => ({ ip: "127.0.0.1" })) }));

import {
  manejadorBloqueoTarjeta,
  manejadorObtenerCuenta,
  manejadorPagoTarjeta,
  manejadorRevelarCvv,
} from "./cuenta.controlador";
import * as servicio from "./cuenta.servicio";

const response = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() });
const request = (body: unknown) => ({ body, user: { id: "user-1" } });

describe("controlador de cuentas", () => {
  beforeEach(() => jest.clearAllMocks());

  it("devuelve el resumen de cuenta", async () => {
    (servicio.obtenerResumenCuenta as jest.Mock).mockResolvedValue({ balance: 10 });
    const res = response();

    await manejadorObtenerCuenta(request({}) as never, res as never);

    expect(res.json).toHaveBeenCalledWith({ balance: 10 });
  });

  it("bloquea tarjeta, paga y revela CVV", async () => {
    (servicio.establecerBloqueoTarjeta as jest.Mock).mockResolvedValue(true);
    (servicio.pagarTarjeta as jest.Mock).mockResolvedValue({ paid: true });
    (servicio.revelarCvv as jest.Mock).mockResolvedValue({ cvv: "123" });

    const resBloqueo = response();
    await manejadorBloqueoTarjeta(request({ blocked: true }) as never, resBloqueo as never);
    expect(resBloqueo.json).toHaveBeenCalledWith({ cardBlocked: true });

    const resPago = response();
    await manejadorPagoTarjeta(request({ amount: 20 }) as never, resPago as never);
    expect(resPago.json).toHaveBeenCalledWith({ paid: true });

    const resCvv = response();
    await manejadorRevelarCvv(request({ otpCode: "123456" }) as never, resCvv as never);
    expect(resCvv.json).toHaveBeenCalledWith({ cvv: "123" });
  });
});
