const mockEnv = {
  BREVO_API_KEY: undefined as string | undefined,
  BREVO_FROM_EMAIL: undefined as string | undefined,
  RESEND_API_KEY: undefined as string | undefined,
  RESEND_FROM: "NovaBank <test@example.com>",
};

jest.mock("../../configuracion/entorno", () => ({ env: mockEnv }));

import { enviarCorreo } from "./correo";

describe("servicio de correo", () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
    mockEnv.BREVO_API_KEY = undefined;
    mockEnv.BREVO_FROM_EMAIL = undefined;
    mockEnv.RESEND_API_KEY = undefined;
    jest.restoreAllMocks();
  });

  it("rechaza cuando ningún proveedor está configurado", async () => {
    await expect(enviarCorreo("user@example.com", "Asunto", "<p>Hola</p>")).rejects.toMatchObject({ status: 503 });
  });

  it("envía por Brevo incluyendo adjuntos", async () => {
    mockEnv.BREVO_API_KEY = "brevo-key";
    mockEnv.BREVO_FROM_EMAIL = "from@example.com";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201 }) as typeof fetch;

    await enviarCorreo("user@example.com", "Asunto", "<p>Hola</p>", [{ name: "a.pdf", content: "base64" }]);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({ method: "POST", body: expect.stringContaining('"attachment"') })
    );
  });

  it("envía por Resend cuando Brevo no está disponible", async () => {
    mockEnv.RESEND_API_KEY = "resend-key";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof fetch;

    await expect(enviarCorreo("user@example.com", "Asunto", "<p>Hola</p>")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
  });

  it("convierte errores del proveedor en 502", async () => {
    mockEnv.BREVO_API_KEY = "brevo-key";
    mockEnv.BREVO_FROM_EMAIL = "from@example.com";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "error",
    }) as typeof fetch;

    await expect(enviarCorreo("user@example.com", "Asunto", "<p>Hola</p>")).rejects.toMatchObject({ status: 502 });
  });
});
