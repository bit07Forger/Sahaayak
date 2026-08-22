/**
 * Configuration and Policy Rules for the Sahaayak AI Chatbot
 */
export interface ChatbotPolicyConfig {
  supportedTopics: string[];
  unsupportedTopics: string[];
  tone: 'patient' | 'informative' | 'plain';
  
  fallbackMessages: {
    outOfScope: string;
    noApprovedAnswer: string;
    serviceUnavailable: string;
    bypassAttempt: string;
    workflowWriteAttempt: string;
  };

  escalationContact: {
    email: string;
    notes: string;
  };
}

export interface ChatRequestInput {
  serviceId: string;
  message: string;
  conversation?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export type ChatStatus = 'answered' | 'out_of_scope' | 'unavailable' | 'invalid_request';

export interface SafeChatSource {
  title: string;
  url?: string;
}

export interface SafeChatResponse {
  status: ChatStatus;
  answer: string;
  sources: SafeChatSource[];
  followUp?: string;
}

export type ChatSafetyDecision =
  | { action: 'allow'; sanitizedInput: ChatRequestInput }
  | { action: 'refuse'; response: SafeChatResponse }
  | { action: 'invalid'; error: string };
