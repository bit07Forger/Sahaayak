# Accessibility Design Guidelines — Sahaayak

Accessibility is the foundational constraint of the Sahaayak project. This document outlines rules to ensure compatibility with screen readers, motor-assistive tech, and visual profiles.

---

## 1. Adaptive Sizing & Themes

Sahaayak manages interface layouts dynamically through CSS classes controlled by React context parameters:

| Preference Mode | Implementation | Visual Outcome |
|-----------------|----------------|----------------|
| **Normal Text** | Default styling | Baseline readable sizes. |
| **Large Text** | `html` gets `.text-scale-large` | 125% font size magnification. |
| **Extra Large** | `html` gets `.text-scale-xl` | 150% font size magnification. |
| **High Contrast** | Root body toggles `.high-contrast` | Dark #000 background, neon yellow text, high border values, removal of transparent gradients. |

---

## 2. Structural & Layout Best Practices

- **Strict Semantics**: Use native elements (`<main>`, `<header>`, `<nav>`, `<button>`, `<input>`) instead of custom `<div>` keybind listeners.
- **Focus Indicators**: Active elements must draw explicit, thick outlines:
  ```css
  /* Focus indicator */
  .high-contrast :focus-visible {
    outline: 4px solid #facc15 !important;
    outline-offset: 2px;
  }
  ```
- **Form Labels**: Every text field has a visible, programmatically bound `<label htmlFor="...">` identifier.
- **Screen Reader Announcements**:
  - Integrate `<div aria-live="polite">` components to notify users when:
    - Audio recordings finish or fail.
    - AI parsing yields a confirmation text.
    - Input verification alerts error statuses.

---

## 3. Keyboard Navigation Matrix

- **Tab**: Step chronologically through interactive fields.
- **Shift + Tab**: Step backwards.
- **Enter / Space**: Activate buttons and toggle choices.
- **Escape**: Cancel confirmation panels or reset microphone capture.
- **TabIndex Limits**: Do not use `tabIndex > 0` which breaks native browser reading sequences.
- **Contrast Ratios**: Normal text displays at minimum 4.5:1 contrast, and High Contrast mode increases this to over 10:1.
