import { ZodError, z } from "zod";
import { ErrorHttp, errorHandler, notFoundHandler } from "./manejadorErrores";

function responseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("manejadores de errores HTTP", () => {
  it("responde 404 para recursos inexistentes", () => {
    const response = responseMock();

    notFoundHandler({} as never, response as never);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: "Recurso no encontrado" });
  });

  it("formatea errores de validación de Zod", () => {
    const response = responseMock();
    const error = z.object({ email: z.string().email() }).safeParse({ email: "x" }).error as ZodError;

    errorHandler(error, {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Datos inválidos",
      details: error.flatten(),
    });
  });

  it("responde los detalles de un ErrorHttp", () => {
    const response = responseMock();

    errorHandler(new ErrorHttp(422, "No válido", { field: "email" }), {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({ error: "No válido", field: "email" });
  });

  it("trata JSON inválido como error 400", () => {
    const response = responseMock();
    const error = Object.assign(new SyntaxError("JSON inválido"), { status: 400 });

    errorHandler(error, {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: "El cuerpo de la solicitud no es JSON válido" });
  });

  it("responde 500 para errores desconocidos", () => {
    const response = responseMock();
    const originalConsoleError = console.error;
    console.error = jest.fn();

    errorHandler(new Error("fallo"), {} as never, response as never, jest.fn());

    console.error = originalConsoleError;
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalled();
  });
});
