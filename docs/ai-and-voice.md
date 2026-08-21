# Voice Synthesis & AI Parsing — Sahaayak

This document explains the text-to-speech, speech-to-text, and natural-language interpretation layers.

---

## 1. Interaction Pipeline

```text
  [User Action: Speeds/Types Raw String]
                 │
                 ▼
  [SpeechToText: Web Speech Recognition API]
                 │ (Raw Audio Transcript Text)
                 ▼
  [Backend Service: /api/answers/interpret]
                 │ (LLM calls Gemini / Fallback Regex match)
                 ▼
  [Interpreted Structure Returned]
                 │ (Structured dates / flags)
                 ▼
  [User Confirmation Modal] ─── (Edit / Retry) ───► [Save to Database]
```

---

## 2. Voice Interfaces

### Text-To-Speech (TTS)
- **Engine**: Browser-native `window.speechSynthesis`.
- **Functionality**: Reads key sections, labels, and question headers aloud when the voice helper is toggled.
- **Speed**: Configurable voice speed matching database preference values:
  - Slow: `rate = 0.8`
  - Normal: `rate = 1.0`
  - Fast: `rate = 1.2`

### Speech-To-Text (STT)
- **Engine**: Browser-native `window.SpeechRecognition` (or `window.webkitSpeechRecognition`).
- **Functionality**: Capitalizes on client-side microphones to record voice answers and returns raw strings immediately into input placeholders.

---

## 3. AI Service & Interpret Call

The AI parser extracts structured parameters from natural language inputs using the Gemini API or a deterministic developer fallback mode (when offline or keys are not provided).

### Extraction Matrix Examples

| Field Key | User Natural Speech input | Clean Interpreted Value |
|-----------|---------------------------|-------------------------|
| `dob` | "I was born on July eleventh nineteen eighty" | `1980-07-11` |
| `has_impairment` | "Yeah, unfortunately, I have a walking disability" | `true` |
| `vehicle_plate` | "My vehicle plate is California ABC one two three" | `ABC123` |

### Offline/API Fallback Mode
If Gemini API keys are missing or requests time out, the server defaults to regex mapping rules:
- Date regex matches month terms and numbers.
- Booleans identify "yes", "yeah", "sure", "no", "not".
- Text fallbacks use clean string trims.
- Provides a clean user alert: *"Running in Local Match Mode. AI functionality restricted."*
