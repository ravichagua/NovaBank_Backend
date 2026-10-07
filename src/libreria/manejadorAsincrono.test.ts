import { asyncHandler } from "./manejadorAsincrono";

describe("asyncHandler", () => {
  it("reenvía errores de promesas rechazadas", async () => {
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw new Error("fallo async");
    });

    handler({} as never, {} as never, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "fallo async" }));
  });

  it("permite handlers síncronos", () => {
    const next = jest.fn();
    const response = { json: jest.fn() };
    const handler = asyncHandler((_req, res) => {
      res.json({ ok: true });
    });

    handler({} as never, response as never, next);

    expect(response.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });
});
