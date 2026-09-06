# MemoryMusic

MemoryMusic turns small English and Bahasa Indonesia lessons into catchy musical mnemonics. Choose days, months, or numbers—or enter your own word pairs—then make a fully sung bilingual pop song, follow the lyrics, and check your recall.

## Features

- English → Bahasa Indonesia and Bahasa Indonesia → English
- Built-in days, months, and numbers 1–20 lessons
- Custom lessons with 2–12 bilingual word pairs
- Complete verse-and-chorus lyrics with three musical feels
- Real vocal MP3 generation through Cloudflare AI Gateway and MiniMax Music 2.6
- An instant browser-made instrumental practice beat while the full vocal is generated
- Karaoke-style lyric highlighting, optional pronunciation cues, and recall practice
- Mobile-first responsive layout, keyboard support, and installable PWA shell
- No learner account or tracking; generated MP3s are cached for fast replay

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The instant practice beat starts only after pressing **Play beat**, as required by browser autoplay policies. Pronunciation cues depend on the English and Indonesian voices installed on the device.

The full-vocal endpoint also needs the Cloudflare bindings in `wrangler.jsonc` and an `AI_API_TOKEN` Pages secret. It deliberately uses the funded account named by `AI_ACCOUNT_ID`, because the Pages project and AI billing currently live in separate Cloudflare accounts.

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

The server-side song endpoint limits each IP address to two new renders per day, stores finished MP3s in R2, and serves byte-range responses for iOS Safari. Keep automatic AI credit top-ups disabled unless a project owner deliberately enables them.

## Project structure

- `src/domain/` contains tested lesson, lyrics, timing, practice, validation, and persistence logic.
- `src/audio/` turns the pure timing score into Web Audio events and calls the sung-song API.
- `src/components/` contains the responsive learning studio UI.
- `functions/` generates vocal songs, applies request limits, and streams cached MP3s from R2.
- `public/` contains the installable application shell and Cloudflare Pages routing files.
- `docs/superpowers/` contains the agreed design specification and implementation plan.

## Privacy

The app stores the current lesson and playback preferences in local browser storage. When someone requests a sung song, its selected lesson words are sent through Cloudflare AI Gateway to MiniMax for audio generation. Finished songs are cached in Cloudflare R2; the app does not create learner profiles or include names, email addresses, or other account data in requests.
