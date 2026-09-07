# MemoryMusic

MemoryMusic sets your own words to music as a short memory aid. Choose an English, Indonesian, or Latin lesson, edit the words, then make a recording. Exact words are the default; optional AI songwriting creates a few simple learning lines.

## Features

- English → Bahasa Indonesia and Bahasa Indonesia → English
- English ↔ Latin, including **sum — future tense**: ero, eris, erit, erimus, eritis, erunt
- Choose **English ↔ Latin** in the header to hear the conjugation song, learn the meanings, or add custom Latin word pairs
- Built-in days, months, and numbers 1–20 lessons
- Custom lessons with 2–12 bilingual word pairs
- **Your exact words** is the default: editable text, no lyric LLM or lyric-writing charge, no words added to the model input
- Classical piano and strings are the default in exact-word mode, alongside alternative pop, neo-soul, and indie folk
- Optional **AI memory aid** uses GPT-5.5 for short, simple lyrics; validated at 40–1,500 characters and at most 90 words or 7 words per vocabulary pair
- Real vocal MP3 generation through Cloudflare AI Gateway and MiniMax Music 2.6
- Optional browser-made instrumental practice beat and pronunciation cues, clearly separate from recorded songs
- Full written lyrics, vocabulary notes, and recall practice (no fabricated vocal timing)
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

The server-side endpoints apply best-effort KV limits of four lyric-writing attempts and two music-render attempts per IP per UTC day, reserving quota before contacting the provider. KV is eventually consistent, so these are not an atomic billing cap. Finished drafts and MP3s are cached in R2 under a versioned key; cached requests bypass generation. Audio supports byte-range responses for iOS Safari. Keep automatic AI credit top-ups disabled unless a project owner deliberately enables them.

As checked in Cloudflare's model dashboard on 7 September 2026, MiniMax Music 2.6 costs US $0.15 per track. Exact-word mode skips the lyric-writing LLM entirely. Optional GPT-5.5 lyric writing is billed separately by token usage. **Make music** sends the exact text to MiniMax with `lyrics_optimizer: false`. **Write lyrics** in AI mode does not render audio. **Clear draft** selects another AI variation; producing it can incur a new charge. Cloudflare pricing may change.

Exact recordings use the `v4` cache namespace; short AI memory aids use `v5`. Old `v2` and `v3` audio URLs remain supported. Exact-word drafts and their latest completed recording link are saved locally per lesson/direction. Optional repeat is a native audio playback loop, not another generation. Prompts request a short recording with no added vocal text, but exact pronunciation, output length and adherence remain dependent on the generative audio model and require listening checks.

## Project structure

- `src/domain/` contains tested lesson, lyrics, timing, practice, validation, and persistence logic.
- `src/audio/` turns the pure timing score into Web Audio events and calls the sung-song API.
- `src/components/` contains the responsive learning studio UI.
- `functions/` generates vocal songs, applies request limits, and streams cached MP3s from R2.
- `public/` contains the installable application shell and Cloudflare Pages routing files.
- `docs/superpowers/` contains the agreed design specification and implementation plan.

## Privacy

The app stores the current lesson, typed words and playback preferences in local browser storage. Exact words are sent through Cloudflare to MiniMax only when audio is requested. In optional AI mode, selected lesson words are also sent to OpenAI for lyric writing. AI drafts and finished recordings are cached in Cloudflare R2; do not enter confidential material. The app does not create learner profiles or include account data in model requests.
