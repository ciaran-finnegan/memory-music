import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExactSongStudio } from "./ExactSongStudio";

beforeEach(() => window.localStorage.clear());
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("exact-word studio", () => {
  it("makes music from the edited words without calling the lyric writer and offers opt-in replay", async () => {
    const requests: { url: string; body: unknown }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      requests.push({ url, body: JSON.parse(String(init.body)) });
      return Response.json({ audioUrl: "/api/song-audio/recording?rev=4", cached: false });
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<ExactSongStudio initialLyrics="ero\neris\nerit\nerimus" language="la" storageKey="test-latin" />);
    const input = screen.getByRole("textbox", { name: "Your words" });
    await userEvent.clear(input);
    await userEvent.type(input, "Ero\nEris\nErit");
    expect(screen.getByRole("combobox", { name: "Music style" })).toHaveValue("classical");
    expect(screen.queryByRole("button", { name: /write lyrics/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /make music/i }));
    expect(await screen.findByText(/Your recording is ready/)).toBeVisible();
    expect(requests).toEqual([{ url: "/api/exact-song", body: { lyrics: "Ero\nEris\nErit", language: "la", style: "classical" } }]);
    expect(document.querySelector("audio")).toHaveAttribute("src", "/api/song-audio/recording?rev=4");
    expect(document.querySelector("audio")).not.toHaveAttribute("loop");
    await userEvent.click(screen.getByRole("checkbox", { name: /repeat playback/i }));
    expect(document.querySelector("audio")).toHaveAttribute("loop");
  });
  it("keeps typed words when reopening the same lesson", async () => {
    const first = render(<ExactSongStudio initialLyrics="ero" language="la" storageKey="test-latin" />);
    await userEvent.clear(screen.getByRole("textbox", { name: "Your words" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Your words" }), "Ero\nEris\nErit");
    first.unmount();
    render(<ExactSongStudio initialLyrics="ero" language="la" storageKey="test-latin" />);
    expect(screen.getByRole("textbox", { name: "Your words" })).toHaveValue("Ero\nEris\nErit");
    await userEvent.click(screen.getByRole("button", { name: "Use lesson words" }));
    expect(screen.getByRole("textbox", { name: "Your words" })).toHaveValue("ero");
  });
  it("reconnects to a pending recording after reopening without making a second request", async () => {
    let finish!: (response: Response) => void;
    let requests = 0;
    vi.stubGlobal("fetch", () => { requests += 1; return new Promise<Response>((resolve) => { finish = resolve; }); });
    const first = render(<ExactSongStudio initialLyrics="Ero" language="la" storageKey="test-latin" />);
    await userEvent.click(screen.getByRole("button", { name: /make music/i }));
    first.unmount();
    render(<ExactSongStudio initialLyrics="Ero" language="la" storageKey="test-latin" />);
    expect(screen.getByRole("textbox", { name: "Your words" })).toBeDisabled();
    await act(async () => { finish(Response.json({ audioUrl: "/api/song-audio/old?rev=4" })); });
    expect(await screen.findByText(/Your recording is ready/)).toBeVisible();
    expect(requests).toBe(1);
  });
});
