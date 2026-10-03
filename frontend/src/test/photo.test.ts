import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_UPLOAD_BYTES, PhotoError, fileToJpeg, scaleToFit } from "../lib/photo";

describe("scaleToFit", () => {
  it("shrinks the long side to 1024 and keeps the proportions", () => {
    expect(scaleToFit(3000, 2000)).toEqual({ width: 1024, height: 683 });
    expect(scaleToFit(2000, 3000)).toEqual({ width: 683, height: 1024 });
  });

  it("never enlarges a small photo", () => {
    expect(scaleToFit(640, 480)).toEqual({ width: 640, height: 480 });
  });
});

describe("fileToJpeg", () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: "",
    })) as never;
    HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
      callback(new Blob([`${this.width}x${this.height}`], { type: "image/jpeg" }));
    };
  });

  it("re-encodes a large photo as a smaller JPEG", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }));

    const blob = await fileToJpeg(new File(["x"], "IMG_1.jpg", { type: "image/jpeg" }));

    expect(blob.type).toBe("image/jpeg");
    expect(await blob.text()).toBe("1024x768");
  });

  it("asks the browser to apply the camera's rotation", async () => {
    const createImageBitmap = vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() });
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    await fileToJpeg(new File(["x"], "a.jpg", { type: "image/jpeg" }));

    expect(createImageBitmap.mock.calls[0]?.[1]).toEqual({ imageOrientation: "from-image" });
  });

  it("releases the decoded image", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 10, height: 10, close }));

    await fileToJpeg(new File(["x"], "a.png", { type: "image/png" }));

    expect(close).toHaveBeenCalledOnce();
  });

  it("rejects a file that is not an image", async () => {
    await expect(fileToJpeg(new File(["x"], "notes.txt", { type: "text/plain" }))).rejects.toThrow(
      "Choose an image file",
    );
  });

  it("rejects a file that is too large", async () => {
    const huge = new File(["x"], "huge.jpg", { type: "image/jpeg" });
    Object.defineProperty(huge, "size", { value: MAX_UPLOAD_BYTES + 1 });

    await expect(fileToJpeg(huge)).rejects.toThrow("smaller than 25 MB");
  });

  it("explains an image the browser cannot decode", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new DOMException("bad", "InvalidStateError")));

    const error = await fileToJpeg(new File(["x"], "photo.heic", { type: "image/heic" })).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PhotoError);
    expect(error).toMatchObject({ message: "That image could not be read. Try a JPEG or PNG photo." });
  });
});
