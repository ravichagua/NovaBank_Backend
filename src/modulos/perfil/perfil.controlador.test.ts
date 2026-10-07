jest.mock("./perfil.servicio", () => ({
  solicitarOtpPerfil: jest.fn(),
  actualizarCorreo: jest.fn(),
  actualizarTelefono: jest.fn(),
  actualizarContrasena: jest.fn(),
}));
jest.mock("../../libreria/metaSolicitud", () => ({ obtenerMetaSolicitud: jest.fn(() => ({ ip: "127.0.0.1" })) }));

import {
  manejadorActualizarContrasena,
  manejadorActualizarCorreo,
  manejadorActualizarTelefono,
  manejadorSolicitarOtpPerfil,
} from "./perfil.controlador";
import * as servicio from "./perfil.servicio";

const response = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() });
const request = (body: unknown) => ({ body, user: { id: "user-1" } });

describe("controlador de perfil", () => {
  beforeEach(() => jest.clearAllMocks());

  it("solicita OTP y responde 204", async () => {
    const res = response();

    await manejadorSolicitarOtpPerfil(request({}) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("actualiza correo, teléfono y contraseña", async () => {
    (servicio.actualizarCorreo as jest.Mock).mockResolvedValue({ email: "new@example.com" });
    (servicio.actualizarTelefono as jest.Mock).mockResolvedValue({ phone: "912345678" });

    const emailRes = response();
    await manejadorActualizarCorreo(
      request({ newEmail: "new@example.com", otpCode: "123456" }) as never,
      emailRes as never
    );
    expect(emailRes.json).toHaveBeenCalledWith({ user: { email: "new@example.com" } });

    const phoneRes = response();
    await manejadorActualizarTelefono(
      request({ newPhone: "912345678", otpCode: "123456" }) as never,
      phoneRes as never
    );
    expect(phoneRes.json).toHaveBeenCalledWith({ user: { phone: "912345678" } });

    const passwordRes = response();
    await manejadorActualizarContrasena(
      request({ currentPassword: "old", newPassword: "ClaveSegura123", otpCode: "123456" }) as never,
      passwordRes as never
    );
    expect(passwordRes.status).toHaveBeenCalledWith(204);
  });
});
