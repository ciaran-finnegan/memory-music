import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("MemoryMusic learning studio", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("switches to Latin, shows all future forms, supports recall and custom words, and switches back", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Language course" }), "la");
    expect(screen.getByRole("heading", { name: "To be: future in Latin" })).toBeVisible();
    for (const form of ["ero", "eris", "erit", "erimus", "eritis", "erunt"]) expect(screen.getByText(form, { exact: true })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Days Monday/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^practice$/i }));
    expect(screen.getByText("Choose the Latin match.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /swap languages/i }));
    expect(screen.getByRole("heading", { name: "To be: future in English" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /custom lesson/i }));
    expect(screen.getByLabelText("Latin word 1")).toBeVisible();
    expect(screen.getByLabelText("English word 1")).toBeVisible();
    await user.keyboard("{Escape}");
    await user.selectOptions(screen.getByRole("combobox", { name: "Language course" }), "id");
    expect(screen.getByRole("heading", { name: "Days in Bahasa Indonesia" })).toBeVisible();
  });

  it("changes lesson and shows its generated target vocabulary", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /months/i }));

    expect(screen.getByRole("heading", { name: /months in bahasa indonesia/i })).toBeVisible();
    expect(screen.getByText("Januari")).toBeVisible();
    expect(screen.getByText("Desember")).toBeVisible();
  });

  it("shows learning notes before requesting lyrics and discloses the audio price", () => {
    render(<App />);
    expect(screen.getByText("Senin")).toBeVisible();
    expect(screen.getByText(/\$0\.15/)).toBeVisible();
    expect(screen.queryByText(/clap-clap/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /write lyrics/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /produce this song/i })).not.toBeInTheDocument();
  });

  it("labels browser speech as optional pronunciation rather than singing", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Optional pronunciation & rhythm practice"));
    expect(screen.getByRole("button", { name: /pronunciation cues/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the returned lyrics for review and only renders audio on a separate click", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      requests.push(url);
      return Response.json(url === "/api/lyrics" ? { title: "Last Train Home", lyrics: "[Verse 1]\nThe platform lights run down the line.\n[Chorus]\nSenin, a Monday I can call mine.", model: "openai/gpt-5.5" } : { audioUrl: "/api/song-audio/example?rev=3", cached: false });
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /write lyrics/i }));
    expect(await screen.findByRole("heading", { name: "Last Train Home" })).toBeVisible();
    expect(screen.getByText("The platform lights run down the line.")).toBeVisible();
    expect(requests).toEqual(["/api/lyrics"]);
    await userEvent.click(screen.getByRole("button", { name: /produce this song/i }));
    expect(requests).toEqual(["/api/lyrics", "/api/song"]);
    expect(document.querySelector("audio")).toHaveAttribute("src", "/api/song-audio/example?rev=3");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Language course" }), "la");
    expect(screen.queryByText("The platform lights run down the line.")).not.toBeInTheDocument();
    expect(document.querySelector("audio")).not.toBeInTheDocument();
  });

  it("reverses the learning direction", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /swap languages/i }));

    expect(screen.getByRole("heading", { name: /hari dalam bahasa inggris/i })).toBeVisible();
    expect(screen.getByText("Monday")).toBeVisible();
  });

  it("does not discard a paid draft when a practice-only preference changes", async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", () => new Promise<Response>((resolve) => { finish = resolve; }));
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /write lyrics/i }));
    await userEvent.click(screen.getByText("Optional pronunciation & rhythm practice"));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /practice tempo/i }), "80");
    finish(Response.json({ title: "After the Rain", lyrics: "[Chorus]\nA new day arrives.", model: "openai/gpt-5.5" }));
    expect(await screen.findByRole("heading", { name: "After the Rain" })).toBeVisible();
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
    await user.selectOptions(screen.getByRole("combobox", { name: "Language course" }), "la");
    await user.click(screen.getByRole("button", { name: /custom lesson/i }));
    expect(screen.getByLabelText("English word 1")).toHaveValue("");
    await user.keyboard("{Escape}");
    await user.selectOptions(screen.getByRole("combobox", { name: "Language course" }), "id");
    await user.click(screen.getByRole("button", { name: /custom lesson/i }));
    expect(screen.getByLabelText("English word 1")).toHaveValue("cat");
    expect(screen.getByLabelText("Indonesian word 1")).toHaveValue("kucing");
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
