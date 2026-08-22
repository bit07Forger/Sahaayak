import { ChatRequestInput, ChatSafetyDecision, SafeChatResponse } from '../types/chatbot';
import { ACTIVE_SERVICE } from './dbService';

// Configurable System Limits
export const CHAT_LIMITS = {
  MAX_MESSAGE_LENGTH: 500,
  MAX_CONVERSATION_COUNT: 10,
  MAX_ENTRY_LENGTH: 500,
  MAX_RESPONSE_LENGTH: 1000,
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 10,
};

// Fallback Messages derived from chatbot policy
export const CHAT_FALLBACKS = {
  OUT_OF_SCOPE: 'I cannot assess your eligibility or provide legal, financial, or professional advice. Please check the official scholarship service for support.',
  NO_APPROVED_ANSWER: 'I do not have access to that information in my approved guidelines. Please check the official scholarship service for support.',
  SERVICE_UNAVAILABLE: 'The chatbot service is temporarily unavailable. You can complete the guided questions manually using the standard inputs on the screen.',
  BYPASS_ATTEMPT: 'I cannot share my system instructions or ignore safety policies. How can I help you complete your scholarship preparation questions?',
  WORKFLOW_WRITE_ATTEMPT: 'I cannot enter answers, check off documents, or submit applications for you. Please type or dictate your responses into the standard form inputs on the screen.',
};

/**
 * 1. Policy Guard - Deterministic safety checks before model invocation
 */
export function evaluateSafetyPolicy(input: ChatRequestInput): ChatSafetyDecision {
  // Input Validation checks
  if (!input.serviceId || input.serviceId !== ACTIVE_SERVICE.key) {
    return { action: 'invalid', error: `Invalid or unsupported serviceId. Expected "${ACTIVE_SERVICE.key}".` };
  }

  const cleanMessage = (input.message || '').trim();
  if (!cleanMessage) {
    return { action: 'invalid', error: 'Input message cannot be empty.' };
  }

  if (cleanMessage.length > CHAT_LIMITS.MAX_MESSAGE_LENGTH) {
    return { action: 'invalid', error: `Message exceeds maximum allowed length of ${CHAT_LIMITS.MAX_MESSAGE_LENGTH} characters.` };
  }

  // Conversation history checks
  const history = input.conversation || [];
  if (history.length > CHAT_LIMITS.MAX_CONVERSATION_COUNT) {
    return { action: 'invalid', error: `Conversation history exceeds maximum allowed limit of ${CHAT_LIMITS.MAX_CONVERSATION_COUNT} messages.` };
  }

  for (const entry of history) {
    if (entry.role !== 'user' && entry.role !== 'assistant') {
      return { action: 'invalid', error: `Invalid conversation role "${entry.role}". Only "user" and "assistant" roles are supported.` };
    }
    const cleanContent = (entry.content || '').trim();
    if (cleanContent.length > CHAT_LIMITS.MAX_ENTRY_LENGTH) {
      return { action: 'invalid', error: `Conversation entry content length exceeds ${CHAT_LIMITS.MAX_ENTRY_LENGTH} characters.` };
    }
  }

  // Deterministic Keyword Defenses
  const lowerMsg = cleanMessage.toLowerCase();

  // 1. Eligibility/Outcome Prediction & Professional Advice
  const outOfScopeKeywords = [
    'eligible', 'eligibility', 'approve', 'approved', 'likelihood', 'qualify', 'qualifies',
    'medical', 'legal', 'financial', 'lawyer', 'doctor', 'physician', 'invest', 'tax', 'visa', 'immigration',
    'fee', 'cost', 'price', 'payment', 'charge', 'money', 'waiver', 'will i get'
  ];
  if (outOfScopeKeywords.some(kw => lowerMsg.includes(kw))) {
    return {
      action: 'refuse',
      response: {
        status: 'out_of_scope',
        answer: CHAT_FALLBACKS.OUT_OF_SCOPE,
        sources: [],
      },
    };
  }

  // 2. Submission & Workflow Actions
  const workflowWriteKeywords = [
    'submit', 'apply for me', 'submit for me', 'send application', 'autofill', 'auto-fill', 'fill answer',
    'save for me', 'confirm answer', 'submit application'
  ];
  if (workflowWriteKeywords.some(kw => lowerMsg.includes(kw))) {
    return {
      action: 'refuse',
      response: {
        status: 'out_of_scope',
        answer: CHAT_FALLBACKS.WORKFLOW_WRITE_ATTEMPT,
        sources: [],
      },
    };
  }

  // 3. Prompt Injection / Instructions Reveal / Jailbreaks
  const injectionKeywords = [
    'ignore all', 'ignore previous', 'system prompt', 'system instruction', 'you are now', 'bypass rules',
    'reveal instructions', 'dev mode', 'hidden instruction', 'safety override', 'ignore rules'
  ];
  if (injectionKeywords.some(kw => lowerMsg.includes(kw))) {
    return {
      action: 'refuse',
      response: {
        status: 'invalid_request',
        answer: CHAT_FALLBACKS.BYPASS_ATTEMPT,
        sources: [],
      },
    };
  }

  // 4. Privacy Boundary - Password / Token / ID requests
  const privacyKeywords = [
    'password', 'token', 'private key', 'bank account', 'ssn', 'social security', 'id card', 'passport',
    'license key'
  ];
  if (privacyKeywords.some(kw => lowerMsg.includes(kw))) {
    return {
      action: 'refuse',
      response: {
        status: 'invalid_request',
        answer: 'For your security, please do not share passwords, credentials, tokens, or sensitive identification keys.',
        sources: [],
      },
    };
  }

  // If safe, sanitize input entries by trimming and mapping roles cleanly
  const sanitizedInput: ChatRequestInput = {
    serviceId: input.serviceId,
    message: cleanMessage,
    conversation: history.map(h => ({
      role: h.role,
      content: h.content.trim(),
    })),
  };

  return { action: 'allow', sanitizedInput };
}

/**
 * 2. Raw Model-Output Validator and Sanitizer
 */
export function validateAndSanitizeModelOutput(rawOutput: string): SafeChatResponse {
  const trimmed = (rawOutput || '').trim();

  // Reject empty or excessive length outputs
  if (!trimmed || trimmed.length > CHAT_LIMITS.MAX_RESPONSE_LENGTH) {
    return {
      status: 'unavailable',
      answer: CHAT_FALLBACKS.NO_APPROVED_ANSWER,
      sources: [],
    };
  }

  // Check for disallowed leaked instructions signature
  const disclosureSignatures = [
    'ignore previous instructions', 'system instructions', 'safety policies', 'ignore safety'
  ];
  const lowerOutput = trimmed.toLowerCase();
  if (disclosureSignatures.some(sig => lowerOutput.includes(sig))) {
    return {
      status: 'unavailable',
      answer: CHAT_FALLBACKS.BYPASS_ATTEMPT,
      sources: [],
    };
  }

  // Strip potentially executable HTML tags, scripts, iframes
  let sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ''); // Strip all remaining HTML tags

  // Strip Markdown image embeds and unsafe links
  sanitized = sanitized.replace(/!\[.*?\]\(.*?\)/g, ''); // Strip Markdown image embeds
  sanitized = sanitized.replace(/\[(.*?)\]\(javascript:.*?\)/gi, '$1'); // Strip javascript links

  return {
    status: 'answered',
    answer: sanitized,
    sources: [],
  };
}

/**
 * 3. Prepared Authenticated Rate-Limit Policy (In-Memory)
 */
interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  if (!userId) {
    return { allowed: false, remaining: 0 };
  }

  const now = Date.now();
  let bucket = rateLimitStore.get(userId);

  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitStore.set(userId, bucket);
  }

  // Filter timestamps within the rolling window
  bucket.timestamps = bucket.timestamps.filter(ts => now - ts < CHAT_LIMITS.RATE_LIMIT_WINDOW_MS);

  if (bucket.timestamps.length >= CHAT_LIMITS.MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  const remaining = CHAT_LIMITS.MAX_REQUESTS_PER_WINDOW - bucket.timestamps.length;
  return { allowed: true, remaining };
}

// Clear rate limits periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, bucket] of rateLimitStore.entries()) {
    bucket.timestamps = bucket.timestamps.filter(ts => now - ts < CHAT_LIMITS.RATE_LIMIT_WINDOW_MS);
    if (bucket.timestamps.length === 0) {
      rateLimitStore.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes
