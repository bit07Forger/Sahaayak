# Sahaayak

Sahaayak is an accessibility-first service navigator designed to help individuals with cognitive, visual, hearing, motor, language, or low digital-literacy barriers independently complete essential digital public services.

## Problem
Many people struggle to navigate complex digital public platforms because layouts are cluttered, instructions use dense bureaucratic language, forms lack visible focus/keyboard accessibility, and there is little real-time support.

## Solution
**Sahaayak** provides a simplified, guided, and highly accessible workspace to step through one service at a time (e.g., *Accessible Parking Permit*) using:
- Simple, clear language step-by-step guidance.
- Adaptive UI elements (Text Size scaling and High Contrast mode).
- Voice support (browser-native Text-To-Speech read-aloud and Speech-To-Text voice answers).
- AI natural language interpretation with user confirmation.
- Deterministic data validation.
- Missing documents checklist and readiness calculations.

---

## Technical Stack

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Web Speech API
- **Backend**: Node.js + Express + TypeScript + Firebase Admin SDK
- **Database**: Firebase Cloud Firestore
- **Authentication**: Firebase Authentication

---

## Project Structure

```text
sahaayak/
├── backend/             # Express.js server and data service
├── frontend/            # React (Vite) client application
├── docs/                # Comprehensive architecture & design docs
├── AGENTS.md            # Firebase development standards and rules
├── .env.example         # System configuration blueprint
└── README.md            # Main entry point
```

---

## Installation & Getting Started

### Prerequisites
- Node.js (v18+)
- A Firebase Project (with Firestore and Authentication enabled)

### Step 1: Configuration
1. Obtain configuration credentials from your Firebase Console.
2. Edit `.env` file in the root directory and update with the Firebase variables.

### Step 2: Backend Setup
1. Navigate to the `backend/` folder.
2. Install packages:
   ```bash
   npm install
   ```
3. Start the backend developer server:
   ```bash
   npm run dev
   ```

### Step 3: Frontend Setup
1. Navigate to the `frontend/` folder.
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Core Features
1. **Adaptive Display**: Sizing options (Normal, Large, Extra Large) and High Contrast theme toggling.
2. **Text-To-Speech (Read Aloud)**: Reads page headers, questions, and descriptions out loud.
3. **Speech-To-Text**: Allows dictating answers.
4. **AI Confirmation Flow**: Raw user inputs (written or typed) are parsed backend-side to extract clean variables. The user explicitly reviews, edits, or retries the parsed value before it's saved.
5. **Deterministic Checklists**: The document checklist clearly tracks missing vs optional entries to declare whether a user is "Ready to submit" or needs "More information".

---

## Development Guidelines

All future development, collection updates, and authentication features must adhere to the standards outlined in [`AGENTS.md`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/AGENTS.md). Refer to this file for architecture constraints, Firestore access rules, client/server boundaries, and environment specifications.
