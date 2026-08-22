# SAHAAYAK — FRONTEND UI/UX SPECIFICATION V3

STATUS: AUTHORITATIVE VISUAL SPECIFICATION

IMPORTANT:
This specification supersedes previous visual/UI specifications.

The objective is to completely redesign the visual presentation of Sahaayak while preserving 100% of the existing functionality.

DO NOT change:
- Firebase authentication
- Firebase ID token handling
- routing
- API endpoints
- POST /api/chat
- rate limiting
- OCR functionality
- Tesseract.js
- form state
- validation
- review functionality
- document checklist logic
- readiness logic
- accessibility functionality
- privacy behavior
- local/in-memory draft behavior
- business rules

ONLY redesign the presentation layer unless a visual component must be created to support the redesign.

==================================================
1. DESIGN DIRECTION
==================================================

Sahaayak should look like a modern, polished student-focused application.

The visual identity is:

CALM + EDITORIAL + ACCESSIBLE + PREMIUM + MODERN

Use:

- warm parchment background
- deep indigo typography
- elegant serif display headings
- highly readable interface typography
- subtle glassmorphism
- Apple Tahoe / Liquid Glass inspired buttons
- generous whitespace
- refined cards
- subtle borders
- subtle shadows
- smooth micro-interactions

The interface must NOT look like:

- primitive HTML
- a government form
- an old university portal
- a dashboard made from rectangles
- a page made entirely from horizontal borders
- default browser controls

==================================================
2. PRIMARY VISUAL REFERENCE — LIQUID GLASS BUTTON
==================================================

The supplied LiquidGlassButton component is the reference implementation.

Reuse/adapt the supplied LiquidGlassButton component rather than recreating a flat CSS button.

The reference implementation uses:

- transparent button surface
- inline-flex layout
- generous padding
- glass/specular layer
- backdrop blur
- saturation/brightness adjustment
- illuminated inner rim
- dynamic rim gradient
- subtle depth shadows
- semibold label
- icon + label alignment
- active scale interaction

The supplied implementation uses approximately:

px-12 py-5
inline-flex
items-center
justify-center
transition-transform
active:scale-[0.96]

and the label uses:

text-sm
font-semibold
tracking-wide
flex
items-center
gap-2

However, in Sahaayak:

IMPORTANT:
Do NOT blindly copy the demo's full-screen black LiquidGlassViewport.

Adapt the liquid-glass BUTTON VISUAL LANGUAGE to the Sahaayak application.

The button should look like a piece of translucent polished glass sitting naturally on the warm Sahaayak interface.

==================================================
3. LIQUID GLASS BUTTON SYSTEM
==================================================

Create a reusable:

LiquidGlassButton

component.

Use it for important primary actions.

Examples:

- Start scholarship preparation
- Continue
- Save and continue
- Review answers
- Complete preparation
- Ask Sahaayak

Button structure:

[ text/icon ]

Examples:

[ Start scholarship preparation  → ]

[ Continue  → ]

[ ← Back ]

[ Ask Sahaayak  ✦ ]

The button MUST remain content-sized on desktop.

NEVER:

width: 100%

for desktop primary buttons.

NEVER render the button as a giant horizontal bar.

Desktop:

display: inline-flex

Mobile:
full-width is allowed where appropriate.

==================================================
4. LIQUID GLASS APPEARANCE
==================================================

Primary button appearance:

- translucent surface
- subtle white highlight
- subtle backdrop blur
- soft inner highlight
- thin luminous edge
- restrained shadow
- slight depth
- dark indigo text where appropriate
- icon positioned beside label

Border radius:

14px–18px

Height:

48px–56px

Horizontal padding:

20px–28px

Font:

16px–17px

Font weight:

600

Icon:

18px–20px

Gap:

8px

Interaction:

hover:
slightly increase brightness and elevation

active:
scale approximately 0.96

focus:
3px accessible focus ring

transition:
150–300ms

==================================================
5. BUTTON VARIANTS
==================================================

PRIMARY LIQUID GLASS

Used for the most important action.

Example:

[ Start scholarship preparation → ]

Visual:

- translucent indigo-tinted glass
- subtle luminous rim
- strong readability
- premium appearance

SECONDARY LIQUID GLASS

Used for secondary actions.

Example:

[ Other application preparation → ]

Visual:

- neutral/white translucent glass
- darker text
- lighter rim

TERTIARY

Used for low-priority actions.

Example:

[ Edit section ]

Can use a simple text/icon button.

Do not make every button visually identical.

==================================================
6. COLOR SYSTEM
==================================================

Use:

--surface-page: #F7F5F0
--surface-primary: #FFFFFF
--surface-secondary: #FBFAF7

--ink-primary: #172033
--ink-secondary: #5B6475
--ink-muted: #7B8494

--brand-indigo: #34456B
--brand-indigo-dark: #273653

--accent-saffron: #D99020
--accent-saffron-soft: #FFF3DD

--brand-sage: #52745C
--brand-sage-soft: #EAF2EC

--error: #A83A3A
--error-soft: #FBEAEA

--border-subtle: #E6E2D9

Do not use excessive bright colors.

Do not use neon colors.

Do not make the entire application dark.

==================================================
7. TYPOGRAPHY
==================================================

DISPLAY:

Fraunces

Use for:

- H1
- major H2
- important page titles

INTERFACE:

Atkinson Hyperlegible

Use for:

- navigation
- body
- forms
- buttons
- labels
- helper text
- accessibility controls

H1:
44–52px desktop
34–38px mobile

H2:
30–36px

H3:
21–24px

Body:
17px

Buttons:
16–17px

Inputs:
16–17px

Never use tiny 11–12px text for important UI.

==================================================
8. PAGE WIDTH
==================================================

Desktop application shell:

max-width: 1200px

Centered.

Main reading/form content:

max-width: 760px

Do not stretch forms across the entire screen.

==================================================
9. BACKGROUND
==================================================

Base background:

#F7F5F0

Optional extremely subtle paper texture.

No aggressive gradients.

No large decorative backgrounds that compete with the content.

==================================================
10. HEADER
==================================================

Create a modern application header.

Height:

64–72px

Layout:

Sahaayak

                    Preparation
                    Ask Sahaayak
                    Account

Use:

- subtle translucent white background
- thin bottom border
- optional backdrop blur
- clean spacing

Do not use giant header text.

==================================================
11. PROGRESS NAVIGATION
==================================================

Replace the primitive:

1Start → 2Profile → 3Details → 4Docs → 5Readiness

with a proper progress component.

Desktop:

Start
  ─────
Profile
  ─────
Details
  ─────
Documents
  ─────
Readiness

Each step has:

- number
- label
- state

Completed:
sage

Current:
indigo + saffron indicator

Upcoming:
muted slate

Mobile:

Step 2 of 5
Profile

==================================================
12. CARDS
==================================================

Cards should feel like real product components.

Primary card:

background: white
border: 1px solid #E6E2D9
border-radius: 20px
padding: 28–32px
shadow: subtle

Hover:
small elevation

Do not use thick borders.

Do not put horizontal rules between every line.

==================================================
13. HOME PAGE
==================================================

Structure:

SCHOLARSHIP PREPARATION

How can Sahaayak help you today?

Choose a preparation path and we will guide you
one clear step at a time.

[ Safety boundary ]

[ Primary scholarship card ]

[ Secondary preparation card ]

Tell us what you want to prepare

[ Help composer ]

Your preparation journey

[ 01 ] → [ 02 ] → [ 03 ] → [ 04 ] → [ 05 ]

The hero should have generous whitespace.

Do not make every section full width.

==================================================
14. PRIMARY HOME CARD
==================================================

Card:

SCHOLARSHIP APPLICATION

Prepare a scholarship application

Organise your information, review each answer,
and see what to prepare next.

[ Start scholarship preparation → ]

The CTA must be the LiquidGlassButton.

It must NOT be a full-width bar.

==================================================
15. FORM PAGE
==================================================

Use a centered reading-sheet layout.

At top:

PROFILE

Tell us about yourself

Short explanatory text.

Then:

progress indicator

form card

form fields

bottom action bar

Form width:

720–760px

Inputs:

height: 50–54px
border-radius: 10–12px
font-size: 16–17px

Textareas:

minimum height 140px

Labels:

16–17px
font-weight: 600

Helper text:

14–16px

==================================================
16. FORM ACTIONS
==================================================

Bottom:

[ ← Back ]                       [ Continue → ]

Back:
secondary glass/text button

Continue:
primary LiquidGlassButton

NEVER create a full-width desktop Continue bar.

==================================================
17. REVIEW
==================================================

Use section cards.

Example:

PROFILE                             Edit →

Full name
Ayush...

Email
...

Do not display review data as raw paragraphs.

==================================================
18. DOCUMENT CHECKLIST
==================================================

Use cards.

Example:

Transcript                         COMPLETED

Academic transcript

Personal statement                 MISSING

Scholarship motivation statement

Status badges should be compact.

==================================================
19. READINESS
==================================================

Use neutral preparation language.

Example:

Preparation draft complete

Your application preparation information
has been organised and reviewed.

Never show:

87% eligible

87% ready

eligibility score

fake statistics

==================================================
20. ASK SAHAAYAK
==================================================

Use a compact LiquidGlassButton:

[ ✦ Ask Sahaayak ]

Keep it visually secondary to the main workflow.

Do not alter the API or assistant functionality.

==================================================
21. FORM CONTROLS
==================================================

All controls must be custom styled.

No browser-default:

buttons
inputs
selects
textareas
checkboxes

Focus:

3px accessible focus ring.

Minimum clickable target:

44px.

==================================================
22. ACCESSIBILITY
==================================================

Preserve:

- skip links
- semantic landmarks
- keyboard navigation
- ARIA labels
- ARIA live announcements
- text scaling
- high contrast
- voice controls
- reduced motion

The Liquid Glass effect must never reduce text contrast.

If the glass effect reduces readability:

increase the background opacity rather than reducing accessibility.

==================================================
23. ANIMATION
==================================================

Use subtle motion.

Buttons:

hover:
slight elevation/brightness

active:
scale 0.96

Cards:
slight elevation

Page transitions:
subtle fade/slide

Respect:

prefers-reduced-motion

==================================================
24. RESPONSIVE
==================================================

Desktop:
spacious editorial layout.

Tablet:
reduce padding.

Mobile:
single column.

Mobile buttons:
may become full width.

Mobile form:
16–20px page padding.

Mobile H1:
34–38px.

==================================================
25. IMPORTANT IMPLEMENTATION RULE
==================================================

Before redesigning anything:

INSPECT THE EXISTING CSS.

Look for:

button { width: 100%; }

button { display: block; }

section { border: ... }

input { width: 100%; }

global font-size rules

global border rules

global styles overriding component styles

Remove or override conflicting styles.

The current screenshot indicates that the existing global styling is forcing the UI toward primitive HTML.

Do not simply add more CSS on top of those conflicts.

==================================================
26. FUNCTIONALITY LOCK
==================================================

Visual redesign only.

Do not rewrite business logic.

Do not replace:

Firebase
Express
API calls
OCR
Tesseract
form state
validation
routing
authentication
chat
document logic
readiness logic

unless absolutely required to attach the new presentation components.

==================================================
27. FINAL QUALITY BAR
==================================================

The redesigned interface should look like a real modern product.

When comparing the new page with the current implementation:

The following must visibly change:

- typography
- page width
- spacing
- cards
- navigation
- progress indicator
- buttons
- inputs
- form layout
- visual hierarchy
- color system
- hover states
- focus states

If the result still looks like primitive HTML with CSS added to it,
the redesign is NOT complete.