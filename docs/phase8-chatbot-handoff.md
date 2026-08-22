# Phase 8 Chatbot Handoff — Sahaayak

This document outlines the chatbot safety parameters, adapter contracts, and execution sequences prepared for **Phase 9: AI Chatbot Service and Interface**.

---

## 1. Chatbot Configuration
- **Active Service ID**: `accessible-parking-permit`
- **Policy Version**: `1.0.0`
- **Firestore Paths**:
  - Configuration: `services/{serviceId}/chatConfig/default` (Seeded status: `prepared`)
  - Approved Knowledge: `services/{serviceId}/chatKnowledge/{articleId}` (Seeded count: 7 approved items)

---

## 2. Server-Side Provider Adapter
- **Adapter File**: `backend/src/services/aiProvider.ts`
- **Interface**:
  ```typescript
  export interface AITextGenerationRequest {
    systemInstruction: string;
    userMessage: string;
    context: Array<{ title: string; content: string; sourceId: string }>;
  }

  export interface AITextGenerationResult {
    text: string;
    provider: 'gemini';
    model: string;
  }
  ```
- **SDK Method**: Calls `client.interactions.create` using the Google GenAI Interactions API.
- **Normalized Failure Categories**: Throws `AIProviderError` mapped to `unavailable`, `timeout`, `invalid_response`, or `internal_error`.

---

## 3. Request/Response Contracts
- **Input Validator**: `evaluateSafetyPolicy` in `backend/src/services/chatbotSafety.ts`.
  - Configured Limits: Max 500 characters message, max 10 historical entries, max 500 characters per entry.
  - Enforced Roles: `'user' | 'assistant'` only.
- **Output Validator**: `validateAndSanitizeModelOutput` in `backend/src/services/chatbotSafety.ts`.
  - Sanitization Rules: Strips HTML tags, script execution keywords, and Markdown image embeds.
  - Limits: Returns `'unavailable'` fallback status if output exceeds 1000 characters.

---

## 4. Rate-Limiting Policy
- **Limits**: Configured for 10 requests per 60-second window, tracked in-memory by authenticated `userId`.
- **Handoff Rule**: Phase 9 must hook this check (`checkRateLimit`) inside the routing middleware.

---

## 5. Phase 9 Integration Sequence
Every incoming chat request must execute through this exact pipeline:
1. **Authenticate Request**: Verify bearer token to extract client user identity context (`userId`).
2. **Rate Limit Check**: Invoke `checkRateLimit(userId)`. If exceeded, reject with `429 Too Many Requests`.
3. **Validate Input**: Sanitize formatting. Run request payload through `evaluateSafetyPolicy(input)`. If safety guard returns `refuse`, return the fallback response immediately without calling the AI provider.
4. **Retrieve Context**: Load matching approved knowledge records (`services/{serviceId}/chatKnowledge/*`) from Firestore.
5. **Call Provider**: Invoke `generateText(...)` with the approved context and input message.
6. **Validate Output**: Pass raw model string into `validateAndSanitizeModelOutput(rawText)`.
7. **Construct Response**: Formulate the structured `SafeChatResponse` and return it to the client.

---

## 6. Strict Exclusions
- **No Direct Workflow Mutating**: Do not allow the chatbot to edit Firestore user progress or complete questionnaire steps directly.
- **No Conversation Persistence**: Chat messages must remain ephemeral. Do not create chat logs collection writes in Firestore.
- **No Client SDK Keys**: The frontend React app must never import `@google/genai` or store AI API keys in public environments.

---

## 7. Outstanding Owner Decisions
1. **API Key Provisioning**: Save the Gemini key securely under `GEMINI_API_KEY` in the server deployment secrets.
2. **Escalation Support Endpoint**: Final contact channels to replace placeholders.
3. **Seeding Promotion**: Running `npm run seed:services:apply` on staging databases when ready.
