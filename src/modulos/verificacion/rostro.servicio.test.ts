const mockEnv = {
  FACEPP_API_KEY: undefined as string | undefined,
  FACEPP_API_SECRET: undefined as string | undefined,
  FACEPP_API_BASE: "https://facepp.test",
};

jest.mock("../../configuracion/entorno", () => ({ env: mockEnv }));

import { compareFaces } from "./rostro.servicio";

describe("servicio de comparación facial", () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
    mockEnv.FACEPP_API_KEY = undefined;
    mockEnv.FACEPP_API_SECRET = undefined;
    jest.restoreAllMocks();
  });

  it("rechaza cuando Face++ no está configurado", async () => {
    await expect(compareFaces({ url: "https://example.com/a.jpg" }, { url: "https://example.com/b.jpg" }))
      .rejects.toMatchObject({ status: 503 });
  });

  it("devuelve la coincidencia usando el umbral del proveedor", async () => {
    mockEnv.FACEPP_API_KEY = "key";
    mockEnv.FACEPP_API_SECRET = "secret";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ confidence: 82, thresholds: { "1e-4": 75 } }),
    }) as typeof fetch;

    await expect(compareFaces(
      { url: "https://example.com/a.jpg" },
      { url: "https://example.com/b.jpg" }
    )).resolves.toEqual({ matched: true, confidence: 82, threshold: 75 });
  });

  it("rechaza respuestas sin confianza", async () => {
    mockEnv.FACEPP_API_KEY = "key";
    mockEnv.FACEPP_API_SECRET = "secret";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }) as typeof fetch;

    await expect(compareFaces({ url: "a" }, { url: "b" })).rejects.toMatchObject({ status: 422 });
  });

  it("mapea errores del proveedor a 502", async () => {
    mockEnv.FACEPP_API_KEY = "key";
    mockEnv.FACEPP_API_SECRET = "secret";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error_message: "BAD_REQUEST" }),
    }) as typeof fetch;

    await expect(compareFaces({ url: "a" }, { url: "b" })).rejects.toMatchObject({ status: 502 });
  });
});
