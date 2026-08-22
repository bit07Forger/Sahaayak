# Sahaayak MVP — 3-Minute Submission Demo Script

This script provides a structured, beat-by-beat presentation guide for demonstrating the Sahaayak Scholarship Preparation MVP.

> **Key System Boundary**: Sahaayak is a calm, accessibility-first guided workspace that helps students prepare an application draft. It does **not** decide eligibility, verify official documents, or submit applications to official authorities.

---

## Demo Beats & Spoken Walkthrough

### Beat 1: Problem & Accessibility-First Intent (0:00 - 0:25)
* **Visual**: Signed-out Sahaayak entry screen.
* **Spoken**:
  > *"Applying for scholarships can be overwhelming for students, especially those navigating complex forms with screen readers or high-contrast needs. Sahaayak is designed as a calm, accessible preparation workspace. It breaks application questions into simple steps and keeps draft details safe in user memory."*

### Beat 2: Authenticated Access (0:25 - 0:45)
* **Visual**: Enter test email (`student@example.com`) and password, click **Sign In**.
* **Spoken**:
  > *"Users authenticate securely using Firebase Authentication. Once signed in, students reach their personal quiet workspace."*

### Beat 3: Home Workspace & Accessibility Controls (0:45 - 1:15)
* **Visual**: Authenticated home page showing accessibility toolbar (Text Size, Contrast, Voice Speed/Toggle, Listen to Overview) and primary CTA (*Prepare a scholarship application*).
* **Spoken**:
  > *"Notice the Quiet Wayfinding design—warm parchment background, high legibility, and integrated accessibility tools. Students can scale text, toggle high-contrast mode, or listen to audio overviews at any point. Let's click 'Prepare a scholarship application'."*

### Beat 4: Guided Form, Validation, & In-Memory Draft (1:15 - 1:45)
* **Visual**: Template selection screen → Section 1 (Profile & Academic Details). Enter name, email, school, field of study. Click **Continue**.
* **Spoken**:
  > *"The guided form presents questions one section at a time with live progress tracking. If a required field is missing, clear error announcements focus the input immediately. Answers remain in local memory, allowing students to review and edit their draft before finalizing."*

### Beat 5: Optional Ask Sahaayak Guidance (1:45 - 2:15)
* **Visual**: Scroll to **Ask Sahaayak** panel. Type *"How do I write a good motivation statement?"* and click **Send question**.
* **Spoken**:
  > *"If students need help understanding a question, they can ask Sahaayak. The assistant uses Firebase token-authenticated requests to provide plain-text preparation advice with approved sources. Crucially, Sahaayak gives guidance only—it will never alter form entries or claim to determine eligibility."*

### Beat 6: Privacy-First Browser-Only OCR Assist (2:15 - 2:40)
* **Visual**: Click **Scan a preparation note (Optional)**. Show Consent Disclosure Modal ("This scan runs only in this browser..."), accept consent, select sample preparation note, view candidate suggestions review screen, click **Use this suggestion**, then click **Clear scan data**.
* **Spoken**:
  > *"Students with handwritten notes can use local OCR assist. Before scanning, a clear privacy disclosure explains that the scan runs 100% in browser memory via Tesseract.js. No image or text ever leaves the device, and official IDs are strictly rejected. Suggestions must be explicitly approved by the student."*

### Beat 7: Readiness Summary & Honest Scope Sign-off (2:40 - 3:00)
* **Visual**: Complete form sections → Review screen → Readiness summary (`Preparation draft complete`).
* **Spoken**:
  > *"Finally, the readiness summary shows a clear checklist of prepared items versus missing details, using non-decisional draft language. Sahaayak helps students build confidence and organization before they present their materials to official scholarship providers."*
