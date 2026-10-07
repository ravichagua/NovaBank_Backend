import request from "supertest";
import { crearApp } from "../../aplicacion";

describe("validación de rutas de autenticación", () => {
  const app = crearApp();

  it("rechaza login sin credenciales válidas", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: "no", password: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Datos inválidos");
  });

  it("rechaza refresh sin token", async () => {
    const response = await request(app).post("/api/auth/refresh").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Datos inválidos");
  });

  it("protege el perfil propio", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("No autenticado");
  });
});
