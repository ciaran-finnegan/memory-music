import "@testing-library/jest-dom/vitest";

// Node 25 exposes a partial global localStorage when no backing file is set.
// Replace it with a complete in-memory Storage implementation for jsdom tests.
const values = new Map<string, string>();
const memoryStorage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => { values.delete(key); },
  setItem: (key, value) => { values.set(key, String(value)); },
};

if (typeof window !== "undefined") Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: memoryStorage,
});
