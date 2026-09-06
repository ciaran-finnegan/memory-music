# MemoryMusic

MemoryMusic turns small English and Bahasa Indonesia lessons into catchy browser-made musical mnemonics. Choose days, months, or numbers—or enter your own word pairs—then listen, follow the synchronized lyrics, and check your recall.

## Features

- English → Bahasa Indonesia and Bahasa Indonesia → English
- Built-in days, months, and numbers 1–20 lessons
- Custom lessons with 2–12 bilingual word pairs
- Deterministic lyric variations and three synthesized musical feels
- Karaoke-style timed lyrics, optional system speech cues, and recall practice
- Mobile-first responsive layout, keyboard support, and installable PWA shell
- Local-only persistence: no account, tracking, or API key

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Audio starts only after pressing **Play song**, as required by browser autoplay policies. Spoken word cues depend on the English and Indonesian voices installed on the device; instrumental playback and lyrics work without them.

## Verify and build

```bash
npm run check
```

The production site is written to `dist/`. Preview it with:

```bash
npm run preview
```

## Deploy to Cloudflare Pages

Authenticate Wrangler, then run:

```bash
npx wrangler login
npm run deploy
```

The Pages project is named `memory-music`, uses `main` as its production branch, and serves the static `dist/` directory. Configuration lives in `wrangler.jsonc`; response headers and the SPA fallback are copied from `public/` during the Vite build.

## Project structure

- `src/domain/` contains tested lesson, lyrics, timing, practice, validation, and persistence logic.
- `src/audio/` turns the pure timing score into Web Audio events and optional speech cues.
- `src/components/` contains the responsive learning studio UI.
- `public/` contains the installable application shell and Cloudflare Pages routing files.
- `docs/superpowers/` contains the agreed design specification and implementation plan.

## Privacy

All lesson generation happens on the device. The app stores only the current lesson and playback preferences in local browser storage.
