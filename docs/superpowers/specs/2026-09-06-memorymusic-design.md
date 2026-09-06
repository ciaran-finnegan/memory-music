# MemoryMusic Design Specification

## Product goal

MemoryMusic is a mobile-first bilingual learning app that turns small sets of facts into short, repeatable musical mnemonics. The first release teaches English and Bahasa Indonesia in both directions and includes ready-made lessons for days, months, and numbers, plus a custom lesson builder.

The first release must run completely in the browser. It must not require an account, API key, paid music service, or server-side database. It will be published from a GitHub repository to Cloudflare Pages.

## Audience and primary job

The primary audience is an English or Indonesian speaker who wants to memorize a short vocabulary sequence on a phone. The primary job is: choose something to learn, generate a catchy bilingual chant, play it repeatedly, and practice recall.

## Version-one scope

### Included

- English-to-Indonesian and Indonesian-to-English learning directions.
- Curated lessons for the seven days, twelve months, and numbers one through twenty.
- A custom lesson editor for two-to-twelve source/translation pairs.
- Deterministic lyric generation with repetition, call-and-response, and a recap verse.
- Three browser-generated musical feels: Pop bounce, Island groove, and Study beat.
- Tempo selection at 80, 100, or 120 BPM.
- Web Audio accompaniment with synchronized lyric highlighting.
- Optional browser speech cues for the current learning-language line when a suitable system voice is available.
- Play, pause, restart, seek-by-line, and repeat controls.
- A lightweight recall challenge after listening.
- Local persistence for the most recently generated song and user preferences.
- Installable PWA metadata and an offline application shell.
- Full mobile support from 320 CSS pixels upward, including safe-area padding and touch-sized controls.

### Excluded

- Accounts, cloud synchronization, social sharing, payments, uploaded audio, and server-side storage.
- AI-composed or studio-quality sung vocals.
- Arbitrary prose-to-song generation. Custom input is intentionally limited to paired learning facts.
- Languages beyond English and Bahasa Indonesia.

## Experience flow

1. The home screen opens with the musical player already visible and a clear invitation to choose a lesson.
2. The learner selects a direction and a topic, or opens the custom lesson editor.
3. The app generates a title and compact bilingual lyric arrangement from the selected pairs.
4. Pressing play starts the instrumental arrangement and highlights each lyric line in time. Speech cues can be enabled when supported.
5. The learner may tap any lyric line to continue from that point, alter the feel or tempo, or regenerate the lyric variation.
6. A short practice panel asks the learner to match or recall several translated terms and reports progress immediately.
7. The last song and settings remain available on the next visit.

## Information architecture

The application is a single-page experience with three functional regions:

- **Header:** brand, language direction toggle, and compact sound-status control.
- **Lesson rail:** swipeable topic choices and the custom lesson entry point.
- **Studio:** the signature player, generated lyrics, musical controls, and practice drawer.

On wide screens the lesson rail and studio sit in a two-column layout. On phones they form one vertical flow, with the player and transport remaining easy to reach using a sticky bottom transport bar while audio is active.

## Visual direction

The visual metaphor is a pocket language studio rather than a dashboard. The signature object is a playful cassette/player whose tape window becomes the song progress display. Small sequencer lights support playback state; they are meaningful controls and indicators, not background decoration.

### Color tokens

- **Midnight notation** `#14213D`: primary text and structural linework.
- **Paper sky** `#F5FAFF`: page canvas.
- **Pool blue** `#BDE8F2`: calm learning surfaces.
- **Mango beat** `#FFC857`: primary action and active timing.
- **Guava coral** `#F26B5E`: secondary accents and Indonesian-language cues.
- **Leaf green** `#3C9D77`: success and completed recall.

### Typography

- **Fredoka Variable:** headings, lesson names, large lyric lines, and numerals. Its rounded construction feels musical and works well for young and adult learners without becoming childish.
- **Nunito Sans Variable:** controls, descriptions, form fields, and longer instructional copy.

Fonts are bundled with the application to avoid a render-blocking third-party request and keep the offline shell coherent.

### Layout sketch

```text
Wide                                    Phone
┌──────────────────────────────────┐    ┌──────────────────┐
│ MemoryMusic      EN ⇄ ID   sound │    │ MemoryMusic EN⇄ID│
├───────────┬──────────────────────┤    ├──────────────────┤
│ Lessons   │  Song title + badge  │    │ Swipeable lessons│
│ Days      │ ┌──────────────────┐ │    │ Song title       │
│ Months    │ │ cassette player  │ │    │ ┌──────────────┐ │
│ Numbers   │ └──────────────────┘ │    │ │   cassette   │ │
│ Custom    │  highlighted lyrics │    │ └──────────────┘ │
│           │  practice drawer    │    │ highlighted lyric│
└───────────┴──────────────────────┘    │ song controls    │
                                       │ practice          │
                                       ├──────────────────┤
                                       │ sticky transport │
                                       └──────────────────┘
```

The visual alignment is left-led for reading speed. The cassette is the one expressive centerpiece; surrounding surfaces use restrained asymmetry, thin navy linework, and varied corner shapes rather than a repeated card kit.

### Design self-critique

The initial idea risked becoming a generic collection of bright rounded cards. The revised direction limits decorative color to the cassette and active learning states, uses topic tabs as a physical index rather than equal cards, and lets the changing lyric line provide most of the motion. No decorative gradients, floating blobs, or repeated entrance animations are used.

## Content design

Interface copy is short, direct, and bilingual where the language itself teaches something. Controls retain stable English labels in English-to-Indonesian mode and Indonesian labels in the reverse mode. Learning content always shows both languages, with the target language visually leading.

Generated songs follow this structure:

1. A two-line welcome that names the topic and learning direction.
2. One line per learning pair, alternating a call in the source language and a response in the target language.
3. A rhythmic recap grouping terms into chunks of three or four.
4. A short closing challenge inviting the learner to repeat without looking.

The generator varies connector phrases by variation seed but never changes the supplied vocabulary.

## Technical architecture

### Client

- React with TypeScript and Vite.
- Pure browser APIs for audio (`AudioContext`) and optional speech (`speechSynthesis`).
- CSS modules or focused component styles with shared tokens in a global stylesheet.
- Local storage behind a versioned persistence adapter.
- A small service worker plus web manifest for the offline shell and installation metadata.

### Domain modules

- `catalog`: immutable bilingual lesson data and direction helpers.
- `lyrics`: pure deterministic song-arrangement generation.
- `music`: pure transport/timing plan generation plus an imperative Web Audio player.
- `practice`: question generation and answer evaluation.
- `persistence`: validated local storage reads and writes.

The React layer consumes these modules but contains no vocabulary transformation or scheduling logic. Audio resources are created only after a user gesture and are disposed when playback stops or the view unmounts.

### Hosting

Vite produces static assets in `dist/`. Cloudflare Pages serves that output with SPA fallback behavior and security/cache headers. Deployment is performed with Wrangler after a production build. The GitHub repository contains source, tests, documentation, a README, and a GitHub Actions workflow that runs checks on pushes and pull requests.

## State and data flow

The selected topic, direction, style, tempo, speech preference, variation seed, and generated song form serializable application state. Changing any generation input stops playback, creates a new arrangement, and persists the result. Transport state is transient and is never persisted.

The music scheduler converts each lyric line into a fixed number of beats, creates chord/bass/percussion events for the selected feel, and publishes line changes to the UI. The UI treats the scheduler clock as authoritative so lyric highlighting does not drift from the accompaniment.

## Failure handling

- If Web Audio is unavailable, lyric generation and practice remain usable and the player explains that music playback is unsupported.
- If speech synthesis or a suitable voice is unavailable, speech controls are disabled while instrumental playback continues.
- If the audio context is suspended by a mobile browser, the next explicit play gesture resumes it.
- Invalid custom rows are marked inline; generation remains disabled until at least two complete, non-duplicate pairs exist.
- Corrupt or old local data is ignored safely and replaced with defaults.
- Service-worker update failures never block the online application.

## Accessibility and mobile requirements

- All controls are keyboard operable and expose visible focus states.
- Icon-only controls have accessible names; decorative marks are hidden from assistive technology.
- Text and essential controls meet WCAG AA contrast.
- Active lyrics are announced without repeatedly moving keyboard focus.
- Touch targets are at least 44 by 44 CSS pixels.
- Layout is tested at 320, 375, 768, and 1280 CSS pixels.
- The app respects reduced-motion and high-contrast preferences.
- Audio never autoplays.

## Testing strategy

- Unit tests cover catalog direction mapping, lyrics, music timing plans, practice questions, and persistence validation.
- Component tests cover topic selection, custom lesson validation, generation changes, transport controls, and recall scoring.
- A production build and lint/type checks gate deployment.
- Browser smoke checks cover the primary flow at phone and desktop widths, keyboard navigation, offline shell loading, and an audio start/stop gesture.
- Visual review uses screenshots at phone and desktop widths before release.

## Acceptance criteria

- A learner can generate and play a days, months, or numbers song in either language direction without entering data.
- A learner can generate a song from two-to-twelve valid custom pairs.
- Music playback visibly advances through the lyrics, supports pause/restart, and makes no sound before a user gesture.
- The practice flow gives immediate correct/incorrect feedback and a final score.
- The core experience is fully usable at 320 CSS pixels and with keyboard-only navigation.
- Reloading restores the most recent valid song and preferences.
- The production URL works on Cloudflare Pages, and the source is available in a newly created GitHub repository.
