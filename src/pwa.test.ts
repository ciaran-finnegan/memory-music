import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "./registerServiceWorker";

describe("installable application shell", () => {
  it("registers the service worker after the page is ready", async () => {
    const register = vi.fn().mockResolvedValue(undefined);

    await registerServiceWorker(
      { serviceWorker: { register } },
      { addEventListener: vi.fn(), readyState: "complete" },
    );

    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("publishes standalone metadata with both icon purposes", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));

    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toEqual(
      expect.arrayContaining(["any", "maskable"]),
    );
  });
});
