const upload = jest.fn().mockResolvedValue({ secure_url: "https://cdn.example.com/face.jpg" });

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload },
  },
}));

import { subirReferenciaFacial } from "./cloudinary";

describe("almacenamiento de referencias faciales", () => {
  it("sube una imagen y devuelve su URL segura", async () => {
    await expect(subirReferenciaFacial("imagen", "usuario-1")).resolves.toBe("https://cdn.example.com/face.jpg");

    expect(upload).toHaveBeenCalledWith(
      "data:image/jpeg;base64,imagen",
      expect.objectContaining({
        folder: "novabank/face-references",
        public_id: "usuario-1",
        overwrite: true,
        resource_type: "image",
      })
    );
  });

  it("conserva data URIs ya formados", async () => {
    upload.mockResolvedValueOnce({ secure_url: "https://cdn.example.com/face-2.jpg" });

    await subirReferenciaFacial("data:image/png;base64,imagen", "usuario-2");

    expect(upload).toHaveBeenLastCalledWith(
      "data:image/png;base64,imagen",
      expect.any(Object)
    );
  });
});
