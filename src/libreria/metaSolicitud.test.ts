import type { Request } from "express";
import { obtenerMetaSolicitud } from "./metaSolicitud";

describe("metadatos de solicitud", () => {
  it("normaliza IPv4 embebida en IPv6 y lee headers del dispositivo", () => {
    const meta = obtenerMetaSolicitud({
      ip: "::ffff:8.8.8.8",
      headers: {
        "user-agent": "Jest",
        "x-device-model": "Pixel",
        "x-platform": "android",
        "x-app-version": "1.0.0",
      },
    } as unknown as Request);

    expect(meta).toMatchObject({
      ip: "8.8.8.8",
      userAgent: "Jest",
      device: "Pixel",
      platform: "android",
      appVersion: "1.0.0",
    });
  });

  it("permite solicitudes sin IP ni headers opcionales", () => {
    expect(obtenerMetaSolicitud({ headers: {} } as unknown as Request)).toEqual({
      ip: undefined,
      userAgent: undefined,
      device: undefined,
      platform: undefined,
      appVersion: undefined,
      country: undefined,
      city: undefined,
    });
  });
});
