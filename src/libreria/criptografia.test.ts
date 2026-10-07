import { cifrar, descifrar } from "./criptografia";

describe("criptografía", () => {
  it("cifra y descifra texto correctamente", () => {
    const original = "dato sensible";
    const cifrado = cifrar(original);

    expect(cifrado.split(".")).toHaveLength(3);
    expect(descifrar(cifrado)).toBe(original);
  });

  it("rechaza un payload incompleto", () => {
    expect(() => descifrar("invalido")).toThrow("Formato de payload cifrado inválido");
  });

  it("rechaza un payload manipulado", () => {
    const partes = cifrar("dato").split(".");
    partes[2] = Buffer.from("manipulado").toString("base64");

    expect(() => descifrar(partes.join("."))).toThrow();
  });
});
