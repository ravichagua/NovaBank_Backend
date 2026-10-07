const mockEnv: { DNI_PROVIDER_TOKEN: string | undefined } = { DNI_PROVIDER_TOKEN: undefined };

jest.mock("../../configuracion/entorno", () => ({ env: mockEnv }));

import { consultarDni } from "./dni.servicio";

describe("servicio de consulta DNI", () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  it("rechaza la consulta cuando el proveedor no está configurado", async () => {
    await expect(consultarDni("12345678")).rejects.toMatchObject({ status: 503 });
  });

  it("normaliza una respuesta exitosa del proveedor", async () => {
    mockEnv.DNI_PROVIDER_TOKEN = "test-token";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        first_name: "Ana",
        first_last_name: "Perez",
        second_last_name: "Lopez",
      }),
    }) as typeof fetch;

    await expect(consultarDni("12345678")).resolves.toEqual({
      dni: "12345678",
      nombres: "Ana",
      apellidoPaterno: "Perez",
      apellidoMaterno: "Lopez",
      fullName: "Ana Perez Lopez",
    });
  });

  it.each([
    [404, 404],
    [429, 429],
    [500, 502],
  ])("mapea respuestas HTTP %s a ErrorHttp %s", async (status, expectedStatus) => {
    mockEnv.DNI_PROVIDER_TOKEN = "test-token";
    global.fetch = jest.fn().mockResolvedValue({
      ok: status < 400 ? true : false,
      status,
      json: async () => ({}),
    }) as typeof fetch;

    await expect(consultarDni("12345678")).rejects.toMatchObject({ status: expectedStatus });
  });
});
