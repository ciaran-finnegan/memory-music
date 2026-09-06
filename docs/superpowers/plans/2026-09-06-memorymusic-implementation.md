# MemoryMusic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a mobile-first bilingual browser app that generates mnemonic lyrics, plays synchronized synthesized music, and tests recall.

**Architecture:** A static React/Vite PWA keeps domain behavior in pure TypeScript modules and isolates Web Audio behind a small transport class. React owns the editing and playback interface; Cloudflare Pages serves the production build without a backend.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Lucide React, bundled variable fonts, Web Audio API, Speech Synthesis API, Cloudflare Pages/Wrangler.

**Spec:** `docs/superpowers/specs/2026-09-06-memorymusic-design.md`

## Global Constraints

- The application runs entirely in the browser and requires no account, API key, or server-side database.
- The supported learning directions are English-to-Indonesian and Indonesian-to-English.
- Curated topics are days, months, and numbers one through twenty; custom lessons contain two-to-twelve complete unique pairs.
- Audio never autoplays and must begin from an explicit user gesture.
- Touch targets are at least 44 by 44 CSS pixels and layouts support widths from 320 CSS pixels upward.
- The production output is static Vite assets in `dist/` deployed to Cloudflare Pages.

---

### Task 1: Project foundation and bilingual catalog

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/domain/types.ts`
- Create: `src/domain/catalog.test.ts`
- Create: `src/domain/catalog.ts`

**Interfaces:**
- Produces: `Language = "en" | "id"`, `Direction = "en-id" | "id-en"`, `LearningPair`, `Lesson`, `getDirectedPairs(lesson, direction)`, and `getLesson(id)`.

- [ ] **Step 1: Add the package and TypeScript/Vitest configuration**

Define scripts for `dev`, `build`, `test`, `test:run`, `typecheck`, and `check`; configure Vitest for jsdom; and create a minimal Vite HTML entry point.

- [ ] **Step 2: Write the failing catalog tests**

```ts
it("maps Monday to Senin for English to Indonesian", () => {
  expect(getDirectedPairs(getLesson("days"), "en-id")[0]).toEqual({
    source: "Monday", target: "Senin", sourceLanguage: "en", targetLanguage: "id",
  });
});

it("reverses a lesson without changing catalog order", () => {
  expect(getDirectedPairs(getLesson("months"), "id-en")[0].source).toBe("Januari");
});
```

- [ ] **Step 3: Run the catalog tests and confirm they fail because the module is absent**

Run: `npm install && npm run test:run -- src/domain/catalog.test.ts`

- [ ] **Step 4: Implement the catalog and shared domain types**

Add verified bilingual values for days, months, and numbers one through twenty. Preserve natural calendar/numeric order in both directions.

- [ ] **Step 5: Run the catalog test and commit**

Run: `npm run test:run -- src/domain/catalog.test.ts`

### Task 2: Mnemonic lyric generator

**Files:**
- Create: `src/domain/lyrics.test.ts`
- Create: `src/domain/lyrics.ts`

**Interfaces:**
- Consumes: `DirectedPair`, `Direction`, and `Lesson` from Task 1.
- Produces: `Song`, `LyricLine`, and `generateSong({ lesson, direction, seed })`.

- [ ] **Step 1: Write failing tests for content fidelity and repeatable variation**

```ts
it("includes every target term without changing spelling", () => {
  const song = generateSong({ lesson: getLesson("days"), direction: "en-id", seed: 2 });
  for (const pair of getDirectedPairs(getLesson("days"), "en-id")) {
    expect(song.lines.some((line) => line.target === pair.target)).toBe(true);
  }
});

it("returns the same arrangement for the same seed", () => {
  expect(generateSong(input)).toEqual(generateSong(input));
});
```

- [ ] **Step 2: Run the lyric tests and confirm the missing behavior fails**

Run: `npm run test:run -- src/domain/lyrics.test.ts`

- [ ] **Step 3: Implement deterministic call, response, recap, and closing lines**

Assign stable IDs and line kinds, preserve supplied vocabulary exactly, and localize connective copy to the source language.

- [ ] **Step 4: Run all domain tests and commit**

Run: `npm run test:run -- src/domain/catalog.test.ts src/domain/lyrics.test.ts`

### Task 3: Music timing and browser audio transport

**Files:**
- Create: `src/domain/music.test.ts`
- Create: `src/domain/music.ts`
- Create: `src/audio/MusicPlayer.ts`

**Interfaces:**
- Consumes: `Song.lines`, `MusicStyle = "pop" | "island" | "study"`, and BPM `80 | 100 | 120`.
- Produces: `createMusicPlan(song, style, bpm): MusicPlan` and `MusicPlayer.play(plan, fromLine, callbacks)` / `pause()` / `stop()` / `dispose()`.

- [ ] **Step 1: Write failing tests for timing, line offsets, and style patterns**

```ts
it("assigns increasing line windows at the selected tempo", () => {
  const plan = createMusicPlan(song, "pop", 100);
  expect(plan.lines[0].startSeconds).toBe(0);
  expect(plan.lines[1].startSeconds).toBeGreaterThan(plan.lines[0].endSeconds);
});

it("keeps the final duration equal to the last line end", () => {
  const plan = createMusicPlan(song, "study", 80);
  expect(plan.durationSeconds).toBe(plan.lines.at(-1)?.endSeconds);
});
```

- [ ] **Step 2: Run the music tests and verify failure**

Run: `npm run test:run -- src/domain/music.test.ts`

- [ ] **Step 3: Implement the pure timing plan**

Use four beats for intro/outro lines, eight beats for pair lines, and style-specific chord, bass, and percussion patterns.

- [ ] **Step 4: Implement the Web Audio adapter**

Create oscillators and short noise/percussion sources only after `play()`, schedule from the selected line, emit authoritative progress/line callbacks, and close timers/nodes on stop or dispose. Trigger optional speech cues at line boundaries without making speech a playback requirement.

- [ ] **Step 5: Run the tests and commit**

Run: `npm run test:run -- src/domain/music.test.ts`

### Task 4: Practice, custom validation, and persistence

**Files:**
- Create: `src/domain/practice.test.ts`
- Create: `src/domain/practice.ts`
- Create: `src/domain/customLesson.test.ts`
- Create: `src/domain/customLesson.ts`
- Create: `src/domain/persistence.test.ts`
- Create: `src/domain/persistence.ts`

**Interfaces:**
- Produces: `createPracticeQuestions(pairs, seed)`, `checkAnswer(question, answer)`, `validateCustomPairs(rows)`, `loadPreferences(storage)`, and `savePreferences(storage, value)`.

- [ ] **Step 1: Write failing tests for answer normalization, distractors, custom rows, and corrupt storage**

```ts
it("accepts answers without case or surrounding-space differences", () => {
  expect(checkAnswer(questionFor("Senin"), "  senin ")).toBe(true);
});

it("requires two complete unique custom pairs", () => {
  expect(validateCustomPairs([{ source: "cat", target: "kucing" }]).valid).toBe(false);
});

it("uses defaults when persisted JSON is corrupt", () => {
  expect(loadPreferences(storageReturning("{"))).toEqual(DEFAULT_PREFERENCES);
});
```

- [ ] **Step 2: Run these tests and verify failure**

Run: `npm run test:run -- src/domain/practice.test.ts src/domain/customLesson.test.ts src/domain/persistence.test.ts`

- [ ] **Step 3: Implement minimal pure modules with deterministic seeded question order**

Return field-specific custom validation errors, normalize recall answers with locale-aware lowercase/trim, and guard versioned storage data at runtime.

- [ ] **Step 4: Run all domain tests and commit**

Run: `npm run test:run -- src/domain`

### Task 5: Responsive learning studio interface

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/LessonPicker.tsx`
- Create: `src/components/CassettePlayer.tsx`
- Create: `src/components/LyricsView.tsx`
- Create: `src/components/SongControls.tsx`
- Create: `src/components/CustomLessonDialog.tsx`
- Create: `src/components/PracticePanel.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: all domain APIs from Tasks 1-4 and the `MusicPlayer` adapter.
- Produces: the complete accessible one-page user experience.

- [ ] **Step 1: Write failing component tests for the primary flows**

```tsx
it("changes lesson and shows its generated target vocabulary", async () => {
  render(<App />);
  await user.click(screen.getByRole("button", { name: /months/i }));
  expect(screen.getByText("Januari")).toBeVisible();
});

it("reverses the learning direction", async () => {
  render(<App />);
  await user.click(screen.getByRole("button", { name: /swap languages/i }));
  expect(screen.getByText("Monday")).toBeVisible();
});
```

- [ ] **Step 2: Run component tests and verify failure**

Run: `npm run test:run -- src/App.test.tsx`

- [ ] **Step 3: Implement the semantic component structure and complete flows**

Wire topic/direction selection, deterministic regenerate, style/tempo controls, audio transport, clickable lyrics, custom lesson dialog, speech toggle, practice scoring, and persistence. Disable unsupported audio/speech with explanatory copy.

- [ ] **Step 4: Implement the approved visual system**

Bundle Fredoka and Nunito Sans variable fonts. Build the navy/sky/mango/coral cassette centerpiece, physical-index lesson navigation, responsive two-column/one-column layout, mobile sticky transport, 44-pixel targets, visible focus states, reduced-motion handling, and safe-area padding.

- [ ] **Step 5: Run component and domain tests, typecheck, and commit**

Run: `npm run check`

### Task 6: PWA, deployment configuration, and documentation

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/icon.svg`
- Create: `public/maskable-icon.svg`
- Create: `public/sw.js`
- Create: `public/_headers`
- Create: `public/_redirects`
- Create: `src/registerServiceWorker.ts`
- Create: `src/pwa.test.ts`
- Create: `wrangler.jsonc`
- Create: `.github/workflows/ci.yml`
- Create: `.gitignore`
- Create: `README.md`
- Modify: `index.html`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: Vite output from Task 5.
- Produces: installable/offline shell, security headers, CI checks, and repeatable Pages deployment.

- [ ] **Step 1: Add manifest and service worker tests to the build expectations**

Add assertions to verify the manifest contains standalone display and required icons, and the service worker precaches the application shell while using cache-first only for revisioned assets.

- [ ] **Step 2: Run the new test and verify failure before adding files**

Run: `npm run test:run -- src/pwa.test.ts`

- [ ] **Step 3: Add PWA assets, registration, SPA redirects, and security headers**

Keep service-worker registration non-blocking and update-safe. Document that a network load refreshes the shell cache.

- [ ] **Step 4: Add Cloudflare and GitHub configuration plus user documentation**

Set `pages_build_output_dir` to `dist`, document local commands and browser audio limitations, and run `npm run check` from CI.

- [ ] **Step 5: Run tests and production build, then commit**

Run: `npm run check && npm run build`

### Task 7: Browser, mobile, and release verification

**Files:**
- Modify: implementation files only if verification exposes defects.

**Interfaces:**
- Produces: verified production candidate at phone and desktop widths.

- [ ] **Step 1: Start the production preview and exercise the main flow**

Verify days, months, numbers, direction swap, custom lesson creation, all three music styles, pause/restart, line seeking, and practice scoring.

- [ ] **Step 2: Capture and inspect 375-pixel and 1280-pixel screenshots**

Check clipping, horizontal overflow, sticky transport behavior, visual hierarchy, and active lyric contrast. Fix and repeat until both layouts are clean.

- [ ] **Step 3: Check keyboard and reduced-motion behavior**

Tab through every interactive element, activate dialogs and playback from the keyboard, verify focus returns from the dialog, and emulate reduced motion.

- [ ] **Step 4: Run final verification and commit any fixes**

Run: `npm run check && npm run build && git status --short`

### Task 8: GitHub and Cloudflare release

**Files:**
- No source files unless deployment reveals a configuration issue.

**Interfaces:**
- Produces: public GitHub repository and public Cloudflare Pages URL.

- [ ] **Step 1: Confirm GitHub and Cloudflare CLI authentication**

Run: `gh auth status` and `npx wrangler whoami`.

- [ ] **Step 2: Create and push the GitHub repository**

Create the public `memory-music` repository from the current `main` branch, add the remote, and push all commits.

- [ ] **Step 3: Deploy the verified `dist/` directory to Cloudflare Pages**

Create or reuse the `memory-music` Pages project and deploy the production build with Wrangler.

- [ ] **Step 4: Verify both remote URLs**

Open the GitHub repository and production site over HTTPS, confirm the latest commit is present, and perform one production smoke flow.
