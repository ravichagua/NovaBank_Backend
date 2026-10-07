import type { NextFunction, Response } from "express";
import { requerirAutenticacion, SolicitudAutenticada } from "./requerirAutenticacion";
import { firmarTokenAcceso } from "../libreria/jwt";

function responseMock(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("middleware de autenticación", () => {
  it("rechaza solicitudes sin Bearer token", () => {
    const request = { headers: {} } as SolicitudAutenticada;
    const response = responseMock();

    requerirAutenticacion(request, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "No autenticado" });
  });

  it("rechaza tokens inválidos", () => {
    const request = { headers: { authorization: "Bearer inválido" } } as SolicitudAutenticada;
    const response = responseMock();

    requerirAutenticacion(request, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Token inválido o expirado" });
  });

  it("adjunta el usuario y continúa con un token válido", () => {
    const request = {
      headers: { authorization: `Bearer ${firmarTokenAcceso({ sub: "1", email: "user@example.com" })}` },
    } as SolicitudAutenticada;
    const siguiente = jest.fn() as NextFunction;

    requerirAutenticacion(request, responseMock(), siguiente);

    expect(request.user).toEqual({ id: "1", email: "user@example.com" });
    expect(siguiente).toHaveBeenCalled();
  });
});
