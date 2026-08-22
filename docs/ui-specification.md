# Sahaayak MVP — Frontend UI Specification

**Document purpose:** This specification defines the frontend experience for the Sahaayak scholarship-preparation MVP. It is the implementation handoff for the frontend participant and is designed to work with the completed Firebase authentication, Express API, deterministic validation, workflow-progress persistence, and accessibility foundations.

**Product promise:** Sahaayak helps a person prepare one important online-service task independently, one clear step at a time. For this MVP, the task is scholarship preparation—not application submission, eligibility determination, document verification, or approval prediction.

---

## 1. Scope

The MVP frontend supports a signed-in user through a guided scholarship-preparation journey: orientation, one question at a time, answer confirmation, document readiness, and a final preparation summary. The normal typed path is always available. Voice support, read aloud, large text, high contrast, and keyboard navigation are optional aids that must not block the core journey.

| Included in the MVP | Explicitly excluded from the MVP |
|---|---|
| Firebase sign-in/session states, the guided scholarship workflow, deterministic validation feedback, answer confirmation, document checklist, readiness summary, accessibility modes, optional read aloud/voice entry, and print/save summary. | Application submission, official eligibility decisions, document upload or verification, payment, user-to-user messaging, caregiver accounts, an AI chat panel, persisted chat history, and an AI provider key in the browser. |

The frontend must use the existing authenticated API boundary for service/workflow data and must not bypass that boundary by writing private progress directly to Firestore.

---

## 2. Design Direction — Quiet Wayfinding

The interface follows the Quiet Wayfinding direction: contemporary civic wayfinding combined with inclusive-service design. It should feel calm, spacious, patient, and dependable rather than transactional or decorative.

| Design rule | Frontend interpretation |
|---|---|
| One task, one moment | A question or action has a single dominant panel. Secondary content is nearby but visually quiet. |
| Orientation before action | Every workflow screen identifies the service, current step, total progress, and immediate purpose before asking for input. |
| Calm explicit feedback | Errors, success, warnings, and status changes use icon, text, and a next action; color alone is never the signal. |
| User control | Typed input, editing, retrying, leaving, and restarting are always visible. Voice and future AI support are optional. |

---

## 3. Visual System

### 3.1 Color roles

The default visual mode is low-glare and light. The palette should be implemented through semantic CSS variables rather than hard-coded component colors.

| Token | Default value | Use |
|---|---|---|
| `--surface-page` | Warm parchment, approximately #F5F0E7 | Main page background. |
| `--surface-panel` | Warm off-white, approximately #FFFDF8 | Question/action panels and modal surfaces. |
| `--ink-primary` | Deep indigo, approximately #28334D | Primary text, navigation, primary buttons. |
| `--ink-secondary` | Muted slate, approximately #596174 | Supporting text and inactive controls. |
| `--brand-saffron` | #D98D16 | Active route marker, focused confirmation detail, compact brand mark only. |
| `--status-success` | Muted sage, approximately #5E7C65 | Confirmed answers and completed route markers. |
| `--status-warning` | Dark saffron/amber | Missing document or needs-review states. |
| `--status-error` | Deep accessible red | Validation and recoverable system errors. |
| `--border-subtle` | Soft sand/indigo tint | Panel boundaries and dividers. |

High-contrast mode must replace the default palette with a near-black background, white primary text, and yellow focus/action treatment. It is a functional accessibility mode, not a cosmetic theme.

### 3.2 Typography

Use Atkinson Hyperlegible for functional text, labels, controls, inputs, validation messages, and status content. Use Fraunces only for service headings and key reassurance statements. Avoid all-caps except short route labels such as `STEP 2 OF 5`.

| Role | Typeface | Desktop target | Mobile target | Rules |
|---|---|---|---|---|
| Service heading | Fraunces | 40–48 px | 32–36 px | Sentence case; maximum two lines. |
| Page/question heading | Fraunces | 32–38 px | 28–32 px | One direct question per screen. |
| Body text | Atkinson Hyperlegible | 18 px | 18 px | Comfortable 1.5–1.7 line height. |
| Labels and controls | Atkinson Hyperlegible | 16–18 px | 16–18 px | Never rely on placeholder text as the only label. |
| Help/error text | Atkinson Hyperlegible | 16 px | 16 px | Plain language; icon plus text. |

### 3.3 Layout and spacing

The signature structure is an asymmetric orientation rail. Do not replace it with a centered dashboard or a generic sequence of identical cards.

| Viewport | Layout |
|---|---|
| Desktop, 1024 px and above | Fixed-width left rail of approximately 272–304 px; main action panel offset to the right with an 840 px maximum reading width. |
| Tablet, 768–1023 px | Narrower rail or collapsible orientation column; the current step remains persistent. |
| Mobile, below 768 px | The rail becomes a compact top orientation strip showing service name, Step X of Y, and a horizontally scrollable or condensed route. Accessibility controls remain reachable without scrolling past the current task. |

Use a four-point spacing scale: 8, 12, 16, 24, 32, 48, and 64 px. Panels have generous internal spacing; no required control may be placed solely in a hover state.

---

## 4. Information Architecture and Routes

The application is a guided flow, not a broad dashboard. Route names may follow the existing router convention, but these screens and escape routes must exist.

| Route purpose | Primary user goal | Required escape route |
|---|---|---|
| Welcome/landing | Understand what Sahaayak can and cannot do; begin preparation. | Sign in, start, accessibility controls. |
| Sign in/register | Access saved preparation progress. | Return to welcome. |
| Workflow question | Answer one approved scholarship question. | Back, save/leave if supported, restart with confirmation. |
| Answer confirmation | Review and approve the captured value. | Edit answer, return to previous step. |
| Document checklist | Mark required and optional documents as ready or still needed. | Return to last question; leave with saved state if supported. |
| Readiness summary | Understand preparation status and next official steps. | Return to a specific answer/document, print/save, restart. |
| Accessibility preferences | Adjust text, contrast, and voice reading speed. | Close and return to the exact prior screen. |

---

## 5. Primary User Journey

```text
Welcome → Sign in/Register (if required) → Start preparation
  → Question 1 → Confirm answer → Question 2 → Confirm answer
  → … → Final question → Document checklist → Readiness summary
  → Print/save summary or return to an item that needs attention
```

The progress route must show completed, current, and upcoming items. A user may move backward freely. Forward movement is allowed only after the current answer is valid and, where required, explicitly confirmed.

---

## 6. Screen Specifications

### 6.1 Welcome screen

**Purpose:** Explain the service boundary and reduce hesitation before the user begins.

| Region | Required content and behavior |
|---|---|
| Header | Visible Sahaayak open-path/hand mark, Atkinson Hyperlegible wordmark, and compact accessibility controls. |
| Orientation preview | A short route-line preview showing Questions → Documents → Your preparation summary. This must use the same visual language as the workflow rail. |
| Primary heading | "Let's prepare your application one step at a time." |
| Service statement | State the exact scholarship service name when configured; otherwise use a clear non-final placeholder that content owners must replace. |
| Capability boundary | Plain text: "Sahaayak helps prepare information and documents. It does not submit an application, decide eligibility, or verify documents." |
| Listen control | A prominent "Listen to this page" control with icon and understated waveform cue. It must be keyboard reachable and announce active/inactive state. |
| Primary CTA | "Start preparing" or "Continue preparing", depending on authentication/progress state. |
| Secondary CTA | "How this works", opening a concise in-page explanation or accessible dialog. |

### 6.2 Authentication screens

**Purpose:** Support the already-built Firebase registration/login flows without adding account complexity.

| Requirement | Specification |
|---|---|
| Structure | Reuse the orientation rail/top strip and show a small route context: "Sign in to save your progress." |
| Sign-in form | Email, password, submit, forgot-password link only if existing functionality supports it, and link to registration. |
| Registration form | Email, password, confirmation only if current auth logic requires it, plain password guidance, and link to sign in. |
| Loading | Disable only the submit control while keeping visible field values and a spoken "Signing you in…" status. |
| Error handling | Show a concise error summary above the form and an inline message near the relevant field when applicable. Never expose Firebase raw errors. |
| Post-success route | Return to saved workflow progress when available; otherwise begin the service introduction/question flow. |

### 6.3 Shared workflow shell

This shell wraps question, confirmation, document, and summary screens.

| Region | Desktop behavior | Mobile behavior |
|---|---|---|
| Orientation rail | Displays brand, service name, vertical route line, completed/current/upcoming markers, accessibility controls, and "Leave preparation" action. | Becomes top strip with service name, current step, compact progress bar/route, and access to preferences. |
| Main region | Contains one dominant wayfinding panel. | Contains one full-width action panel with 16–20 px outer padding. |
| Wayfinding panel | Rounded corners, slight left directional notch, low-elevation shadow, and strong heading hierarchy. | Same treatment, but notch may become a compact top indicator to preserve width. |
| Footer actions | Back on left; primary action on right; actions maintain visual order and touch targets. | Sticky-safe bottom action region only if it does not hide error/help content. |

### 6.4 Question screen

**Purpose:** Gather one workflow answer at a time.

| Element | Specification |
|---|---|
| Route context | "Scholarship preparation · Step 2 of 5" and the current route marker. |
| Question | One direct, plain-language question. Avoid compound requests. |
| Help text | Optional short explanation below the question. A "Why we ask this" disclosure may be used only when content exists. |
| Input | Use the input type that matches the question: text, select/radio group, numeric field, or date input. Ensure visible label and descriptive help. |
| Voice option | A secondary "Answer by voice" control only where browser support and privacy disclosure are available. Typed input remains visible. |
| Read aloud | "Listen to this question" control appears before the form control. |
| Validation | Validate after user interaction and on continue. Error has icon, text, field association, and a direct correction instruction. |
| Navigation | Back never discards values. Continue is disabled only when no input is present; otherwise it validates and either shows feedback or advances to confirmation. |

### 6.5 Answer confirmation screen

**Purpose:** Preserve user control over typed, voice-derived, or future AI-suggested values.

| Element | Specification |
|---|---|
| Heading | "Is this correct?" |
| Answer review | Display the exact captured value in a high-contrast, read-only review block. |
| Context | Repeat the question in smaller text above the answer. |
| Primary action | "Yes, continue" saves/marks confirmation and moves to the next workflow item. |
| Secondary action | "Edit my answer" returns focus to the corresponding input with the existing value preserved. |
| Voice/future AI disclosure | When a value originated from voice or a future assistive service, show: "Please review this before continuing." Never auto-confirm. |

### 6.6 Document checklist

**Purpose:** Help users prepare required evidence without collecting or verifying files.

| Element | Specification |
|---|---|
| Heading | "Check the documents you may need" |
| Intro | Explain that Sahaayak does not upload or verify documents; the checklist is for preparation. |
| Item design | Each item shows document name, concise reason, required/optional badge with text, status control, and optional official guidance link. |
| Status choices | "I have this", "I still need this", and "Not sure". Avoid a binary checkbox when the state needs clarification. |
| Missing state | Show a plain-language suggestion and return link to official information if approved. Do not predict eligibility. |
| Progress summary | State the number marked ready and the number needing attention with text, not color alone. |
| Navigation | Back returns to final question; primary action is "See my preparation summary". |

### 6.7 Readiness summary

**Purpose:** Give a clear, non-decisional preparation result.

| Region | Required content |
|---|---|
| Status heading | "Ready to review" when all required preparation items are marked ready, otherwise "More information is required". |
| Clarifying copy | State that this is a preparation summary, not an eligibility or submission decision. |
| Information summary | List confirmed answers in readable label/value rows with Edit links back to the exact question. |
| Document summary | Separate "Marked ready", "Still needed", and "Not sure" document groups. |
| Next steps | Approved official next step or a clear statement to review the scholarship service. Do not invent deadlines or URLs. |
| Actions | "Print or save this summary", "Review missing items", and "Start again" with a confirmation dialog. |

### 6.8 Accessibility preferences panel

The panel is available from every screen and may be a dialog on desktop or a bottom sheet/page on mobile.

| Control | Required behavior |
|---|---|
| Text size | Default, Large, and Extra large options. Apply immediately; persist locally if existing preference persistence supports it. |
| Contrast | Default and High contrast. Apply immediately without losing current input. |
| Read-aloud speed | Slower, normal, faster. Present only when text-to-speech is available. |
| Reduce motion | Respect system preference by default; provide a user choice only if the existing settings model supports it. |
| Close behavior | Return focus to the trigger and retain any work in progress. |

---

## 7. Reusable Component Inventory

| Component | Responsibilities | Must not do |
|---|---|---|
| AppShell | Page landmarks, theme/accessibility state, error boundary, routing frame. | Fetch workflow data directly. |
| OrientationRail | Service context, visual route, compact leave action, preferences trigger. | Determine validation or readiness. |
| ProgressRoute | Completed/current/upcoming marker rendering from workflow state. | Infer completion from UI position alone. |
| WayfindingPanel | Consistent action-panel layout, directional notch, heading/action slots. | Hide actions in hover-only states. |
| QuestionStep | Render one approved question type, help text, input, and local validation state. | Invent a question or write directly to Firestore. |
| ReadAloudControl | Speak visible approved text and expose playback state. | Be required to continue. |
| VoiceInputControl | Request microphone permission, expose listening/error states, return a draft value for review. | Auto-submit or auto-confirm a value. |
| AnswerConfirmation | Review/confirm or edit a captured value. | Change the answer silently. |
| DocumentChecklist | Display approved document items and controlled user statuses. | Upload/verify a file. |
| ReadinessSummary | Render the deterministic server/client readiness output and edit links. | Say a user is eligible or application-approved. |
| AccessibleNotice | Success, info, warning, error patterns with icon, heading, copy, and action. | Communicate state with color only. |
| LoadingState | Loading label/skeleton with no false progress claim. | Block Back/leave controls without explanation. |
| EmptyOrErrorState | Safe retry and return action for API failure/missing service. | Expose raw backend errors. |

---

## 8. Frontend State Model

The UI state must distinguish local draft values from server-confirmed workflow progress.

| State | Source | UI behavior |
|---|---|---|
| `session` | Firebase session listener/current token helper | Determines signed-in, loading, signed-out, and expired-session views. |
| `service` | Authenticated API response | Stores service name, version, questions, documents, and approved official source metadata. |
| `progress` | Authenticated API response | Stores current step, confirmed answers, document statuses, and readiness state. |
| `draftAnswer` | Local component/form state | Persists while editing; is not treated as confirmed. |
| `validation` | Deterministic client validator plus safe API response | Shows actionable field or page errors. |
| `requestState` | Local async state | Uses idle, loading, success, error rather than ambiguous booleans. |
| `preferences` | Local preference state | Text size, contrast, motion, and read-aloud speed; applied without data loss. |

Use a single workflow state owner, such as a context/reducer or route-level state module, to avoid divergence between the rail, question panel, confirmation screen, and summary.

---

## 9. UI States and Error Behavior

| Scenario | Required UI response | User recovery |
|---|---|---|
| Session loading | Calm loading panel; do not flash sign-in screen. | Wait; retry only if a real error occurs. |
| Session expired / `AUTH_INVALID` | Plain "Your session could not be verified. Please sign in again." notice. | Sign-in button returns to same workflow path after login where safe. |
| Unauthorized / `AUTH_MISSING` | Plain "Sign in to continue." notice. | Sign-in action. |
| Workflow API loading | Skeleton/readable "Loading your preparation steps…" state. | Back/leave remains available where possible. |
| Workflow API failure | Safe "We could not load your preparation steps." message. | Retry and return-home action. |
| Validation error | Field-level message plus page-level summary if multiple errors. | Focus first invalid input on submit. |
| Save/update failure | Preserve draft value and explain that it was not confirmed yet. | Retry or return without losing the visible draft. |
| Missing service content | Do not render a blank form. | Safe unavailable state and official-support direction if configured. |
| Voice unavailable/denied | Explain that typing remains available. | Keep typed field focused/available. |

The frontend consumes safe backend error codes and messages. It must never display raw stack traces, Firebase errors, API tokens, request headers, or backend configuration details.

---

## 10. Accessibility Requirements

The implementation target is WCAG 2.2 AA-level behavior for the interactive UI, with particular attention to keyboard operation, focus order, text alternatives, error identification, target size, and contrast.

| Requirement | Implementation rule |
|---|---|
| Landmarks | Use one main, a labelled navigation/orientation region, and a clearly labelled preferences dialog/sheet. |
| Keyboard | Every interactive control must be reachable and operable by keyboard. No keyboard trap; dialogs return focus to their trigger. |
| Focus | Provide highly visible focus rings in all themes. On validation failure, move focus to the error summary or first invalid input without unexpected scrolling. |
| Labels | Every input has a visible `<label>` or a programmatically associated label. Placeholder text is supplementary only. |
| Errors | Associate error text with the field using accessible descriptions; summarize multiple errors in a focusable alert region. |
| Status changes | Use `aria-live` sparingly for save, voice, and error feedback. Do not announce every keystroke or progress animation. |
| Color and contrast | Never use color alone. Preserve readable contrast in default and high-contrast themes. |
| Target size | Primary controls and compact icon buttons must have generous touch targets; do not rely on tiny icons without labels. |
| Motion | Respect `prefers-reduced-motion`; route and panel animations are optional and non-essential. |
| Read aloud | Voice output must mirror visible approved text. The user can stop it and continue by typing/reading. |
| Responsive reflow | The workflow remains usable at narrow widths, zoomed text, and high text-size settings without hidden required actions. |

---

## 11. Interaction and Motion

Interactions are reassurance mechanisms, not decoration. Use short 180–240 ms opacity/translate transitions with a strong ease-out. Buttons use a small active scale response. Never delay keyboard-triggered navigation with animation. The route marker may transition between steps, but progress must be understandable even when motion is disabled.

| Interaction | Behavior |
|---|---|
| Continue | Validate immediately; show error or transition to confirmation. |
| Confirm answer | Save/confirm, update route marker, announce step change once, then focus the next screen heading. |
| Back | Preserve draft state and return focus to the prior screen heading or edited input. |
| Toggle preference | Apply without remounting/restarting the workflow. |
| Voice listening | Show a calm waveform only while listening; stop state is explicit; transcript remains editable. |
| Restart | Use a confirmation dialog that explains what will be cleared/retained according to current progress policy. |

---

## 12. Frontend/Backend Integration Contract

The frontend must use the established Firebase and Express boundaries. Endpoint names are implementation-owned by the backend; the UI must not invent new endpoints or bypass authenticated API calls.

| Frontend need | Required backend behavior | Frontend rule |
|---|---|---|
| Session verification | Existing protected-session endpoint verifies the current Firebase ID token. | Fetch a current ID token on demand through the existing helper; do not persist a manual token copy. |
| Service/workflow data | Authenticated API returns approved service/question/document data and current permitted progress. | Render only approved returned content; do not hard-code final scholarship rules in components. |
| Save progress | Authenticated API validates and updates the user's `workflowProgress/{serviceId}` document. | Send only approved draft/confirmation/status payloads; never send a client `uid`. |
| Readiness summary | API or deterministic shared logic returns allowed preparation status and missing items. | Present as preparation status, never eligibility/approval. |
| Errors | API returns safe code/message/request ID response. | Map safe codes to the UI states in this document; never display raw body details. |
| Health/readiness | Public operational endpoints remain for monitoring, not user-facing content. | Do not use as a workflow/data source. |

### Frontend API-client rules

1. Retrieve a current Firebase ID token only when making a protected request.
2. Send it as `Authorization: Bearer <token>` through the existing API helper.
3. Preserve unsaved visible draft values when a request fails.
4. Attach no user ID from route, form, or local storage to private progress writes.
5. Respect 401, 403, 404, 429, and 500 safe response states as defined by the backend contract.
6. Do not call Firestore directly for private user progress unless the backend architecture is formally changed and its emulator rules test passes.

---

## 13. Deferred AI Chat Integration Boundary

The chat interface is not part of this frontend build phase. It remains deferred until the AI participant's Phase 8 work is merged and the protected Phase 9 API is available.

When it is later integrated, the frontend must:

1. call only the protected backend chat route using the existing Firebase token helper;
2. render the server's typed answer, approved sources, optional `followUp`, and status fields as plain text/content;
3. never render provider HTML, arbitrary Markdown, raw model metadata, or model-invented links;
4. never send tokens, passwords, document files, full workflow history, or a provider key to the chat service;
5. keep the chat panel optional and non-blocking; and
6. never use chatbot output to auto-write answers, change document status, advance progress, or determine readiness without explicit user review and the existing deterministic validation path.

No frontend AI SDK, provider key, `GEMINI_API_KEY`, `VITE_*` AI secret, chatbot policy file, or provider adapter belongs in the frontend bundle.

---

## 14. Frontend Build Order

| Build order | Deliverable | Definition of done |
|---|---|---|
| 1 | App shell, tokens, typography, orientation rail, responsive top strip | Quiet Wayfinding layout works at desktop/mobile and preferences are reachable. |
| 2 | Welcome and auth screens | Service boundary, accessible forms, session/loading/error states, and route escapes work. |
| 3 | Question and confirmation flow | One-question panels, deterministic feedback, confirmation/edit loop, and progress route are connected to current API data. |
| 4 | Document checklist and readiness summary | All status controls, grouped summary, edit links, and print/save view work without making eligibility claims. |
| 5 | Accessibility/voice refinement | Keyboard paths, focus behavior, large text, high contrast, read aloud, voice fallback, and reduced-motion behavior are verified. |
| 6 | Frontend integration testing | Auth error states, workflow loading/save failure, validation, responsive layouts, and keyboard-only journey are tested. |
| 7 | Deferred chat integration | Begin only after AI branch merge and protected Phase 9 chat API handoff. |

---

## 15. MVP Acceptance Checklist

| Area | Acceptance criterion |
|---|---|
| Orientation | Every workflow screen shows the service, current step, and a clear route forward/back. |
| Completion | A user can complete the typed scholarship-preparation flow from start to readiness summary. |
| Control | The user can edit answers and document statuses without losing unrelated work. |
| Accessibility | Keyboard-only, large-text, high-contrast, and reduced-motion journeys remain usable. |
| Voice | Read aloud and voice input are optional; their failure never blocks typing. |
| Safety | The UI never claims eligibility, approval, submission, or document verification. |
| Privacy | The frontend exposes no secret, raw backend error, token, or private user data beyond the authenticated user's permitted workflow state. |
| Integration | All private workflow requests use the existing authenticated API helper and never trust a client-provided user ID. |
| AI boundary | No AI chat UI or provider code is included until the AI branch and protected API are integrated. |

---

## References

[1] W3C Web Content Accessibility Guidelines (WCAG) 2.2