import request from "supertest";
import { crearApp } from "../../aplicacion";

describe("Health API", () => {
  const app = crearApp();

  it("responde correctamente en GET /health", async () => {
    const respuesta = await request(app).get("/health");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ status: "ok" });
  });

  it("responde 404 para una ruta inexistente", async () => {
    const respuesta = await request(app).get("/ruta-inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ error: "Recurso no encontrado" });
  });
});
