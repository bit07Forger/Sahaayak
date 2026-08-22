# Sahaayak MVP — Frontend Form & Chat Handoff (Steps 3 & 4)

This document records the discovery of backend API contracts regarding the `Ask Sahaayak` chatbot service and documents the frontend integration state.

---

## 1. Backend Chat Endpoint Discovery

Inspection of the backend server routes in [`backend/src/server.ts`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/backend/src/server.ts) revealed the following registered routes:

- `/health`
- `/ready`
- `/api/auth/me`
- `/api/auth/session`
- `/api/auth/preferences`
- `/api/services`
- `/api/workflows/current`
- `/api/answers/interpret`
- `/api/answers/confirm`
- `/api/answers/validate`
- `/api/documents/checklist`
- `/api/documents/update`
- `/api/readiness`

### Finding
**No protected backend chat endpoint (such as `/api/chat` or `/api/chatbot`) is currently mounted or registered in the Express server.**

While data models ([`backend/src/types/chatbot.ts`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/backend/src/types/chatbot.ts)) and safety evaluator logic ([`backend/src/services/chatbotSafety.ts`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/backend/src/services/chatbotSafety.ts)) exist in source code, no HTTP route handler exposes chat capabilities to the frontend.

---

## 2. Frontend Chatbot Panel Behavior

In accordance with system safety and architectural boundaries:

1. **No Provider Direct Calls**: The frontend does **not** call Gemini, OpenAI, or any provider SDK directly from React.
2. **No Mock/Fake AI Data**: The frontend does **not** generate simulated AI responses or bypass authentication.
3. **Truthful Unavailable State**: The `Ask Sahaayak` panel renders a visible, clear, and accessible disabled/available-soon notice:
   > *"Guided chat will be available after the secure help service is connected. You can continue with the form using typed answers."*
4. **Input Control Safety**: Form input, validation, and review operate independently. Chat output (when available in future steps) will never automatically insert, edit, or submit form fields without explicit user review.

---

## 3. Backend Prerequisite for Chat Activation

To activate the frontend chatbot panel in a future phase:
1. The backend team must create and register a protected route (e.g. `POST /api/chat`) using `authenticateToken` middleware.
2. The route must wrap `evaluateSafetyPolicy` from `chatbotSafety.ts` and return typed `SafeChatResponse` objects.
3. Once mounted, the frontend API client will connect using dynamic Firebase ID tokens.
