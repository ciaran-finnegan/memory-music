import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("MemoryMusic learning studio", () => {
  beforeEach(() => window.localStorage.clear());

  it("changes lesson and shows its generated target vocabulary", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /months/i }));

    expect(screen.getByRole("heading", { name: /months in bahasa indonesia/i })).toBeVisible();
    expect(screen.getByText("Januari")).toBeVisible();
    expect(screen.getByText("Desember")).toBeVisible();
  });

  it("reverses the learning direction", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /swap languages/i }));

    expect(screen.getByRole("heading", { name: /hari dalam bahasa inggris/i })).toBeVisible();
    expect(screen.getByText("Monday")).toBeVisible();
  });

  it("creates a song from custom bilingual pairs", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /custom lesson/i }));
    const dialog = screen.getByRole("dialog", { name: /build a custom lesson/i });
    await user.type(within(dialog).getByLabelText("English word 1"), "cat");
    await user.type(within(dialog).getByLabelText("Indonesian word 1"), "kucing");
    await user.type(within(dialog).getByLabelText("English word 2"), "dog");
    await user.type(within(dialog).getByLabelText("Indonesian word 2"), "anjing");
    await user.click(within(dialog).getByRole("button", { name: /make my song/i }));

    expect(screen.getByRole("heading", { name: /my words in bahasa indonesia/i })).toBeVisible();
    expect(screen.getByText("kucing")).toBeVisible();
    expect(screen.getByText("anjing")).toBeVisible();
  });

  it("opens a recall round for the active lesson", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^practice$/i }));

    expect(screen.getByRole("heading", { name: /quick recall/i })).toBeVisible();
    expect(screen.getByText(/choose the indonesian match/i)).toBeVisible();
  });

  it("moves focus into the custom dialog and returns it when closed", async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole("button", { name: /custom lesson/i });

    await user.click(trigger);
    expect(screen.getByLabelText("English word 1")).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});
