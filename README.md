# Sahaayak

An accessibility-first digital assistance platform. Describe any task in
natural language — voice or text — and Sahaayak guides you through it one
step at a time, with adjustable text size, high contrast, read-aloud, and
speech input available on every screen.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Important: this hasn't been run yet

This project was generated without network access, so `npm install` was
never run and the build was never verified end-to-end. Before relying on
it:

1. Run `npm install` and fix any dependency resolution issues.
2. Run `npm run dev` and click through the three demo flows (scholarship,
   form help, train booking) from the homepage.
3. Run `npm run build` (runs `tsc -b`) to catch any TypeScript errors —
   there's a reasonable chance of small type mismatches given the file
   count, since none of this was type-checked by a real compiler.

## What's implemented

- Homepage with voice + text problem input, no forced category picker
- Text size (Normal / Large / Extra Large), high contrast, read-aloud,
  and a language selector (English / Hindi / Kannada) — all visible in
  the nav bar on every page, all persisted to localStorage
- Understanding screen that requires explicit user confirmation before
  proceeding (never assumes the AI got it right)
- Guided one-question-at-a-time flow with Back/Continue, a "Need help?"
  plain-language explainer, and Step X of Y progress
- AI answer-interpretation confirmation flow (e.g. "two lakh rupees" →
  ₹2,00,000), never auto-saved without explicit confirmation
- Deterministic document checklist and readiness calculation — computed
  from plain booleans, never decided by an AI call
- Editable review screen before completion
- Three demo scenarios: scholarship application, understanding a
  confusing form, and booking a train ticket
- Save/resume via localStorage ("Continue where you left off?")
- Keyboard accessible throughout: semantic buttons/inputs, visible focus
  rings (including a high-contrast-mode variant), no clickable `<div>`s

## What's stubbed or simplified

- **Backend**: `src/services/api.ts` is written against a real REST
  shape (`POST /api/interpret-request`, `POST /api/interpret-answer`)
  but falls back to an offline demo interpreter when no
  `VITE_API_BASE_URL` is set. Point that env var at a real backend to
  switch over — no component code needs to change.
- **Translations**: the EN/HI/KN dictionary in `src/i18n/translations.ts`
  covers the core UI strings (nav, buttons, hero). Question text, help
  text, and document labels in `src/data/demoTasks.ts` are English-only
  in this pass — extending them to all three languages is the next step
  for full multilingual coverage.
- **Speech recognition/synthesis** depend on browser support (Chrome
  has the best Web Speech API coverage). The app degrades gracefully —
  voice controls simply don't render, and the text input still works —
  but this hasn't been tested against a real microphone in this
  environment.

## Project structure

```
src/
├── components/     # Reusable, accessibility-first UI pieces
├── pages/          # Home, Understand, Guide, Review, Complete
├── hooks/          # useSpeech, useAccessibility, useLocalStorage
├── context/         # AppContext ties the above together for every page
├── services/        # api.ts — the only place that calls fetch()
├── data/            # demoTasks.ts — the 3 demo scenarios
├── i18n/             # translations.ts
├── types/            # shared TypeScript types
├── App.tsx, main.tsx, index.css
```
