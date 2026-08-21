/**
 * Cloud Firestore Collection Path Constants
 */
export const FIRESTORE_PATHS = {
  SERVICES: 'services',
  QUESTIONS: 'questions',
  DOCUMENTS: 'documents',
  USERS: 'users',
  WORKFLOW_PROGRESS: 'workflowProgress',
} as const;

/**
 * services/{serviceId}
 * Tracks global metadata for public services.
 */
export interface ServiceDoc {
  id: string; // e.g. "accessible-parking-permit"
  name: string;
  description: string;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

/**
 * services/{serviceId}/questions/{questionId}
 * Stores structured questions associated with a service.
 */
export interface QuestionDoc {
  id: string; // e.g. "name", "dob"
  label: string;
  type: 'text' | 'date' | 'boolean' | 'number';
  description: string;
  order: number;
}

/**
 * services/{serviceId}/documents/{documentId}
 * Tracks checklist attachment rules.
 */
export interface DocumentDoc {
  id: string; // e.g. "identity_proof"
  label: string;
  description: string;
  type: 'REQUIRED' | 'OPTIONAL';
}

/**
 * users/{uid}
 * Stores client-side user metadata and accessibility preferences.
 */
export interface UserDoc {
  uid: string; // Matches Firebase Authentication user UID
  email: string;
  preferences: {
    textSize: 'normal' | 'large' | 'xlarge';
    contrast: 'normal' | 'high';
    voiceSpeed: 'slow' | 'normal' | 'fast';
    voiceEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Answer details stored in workflow progress.
 */
export interface AnswerItem {
  rawValue: string;
  interpretedValue: string;
  isConfirmed: boolean;
  updatedAt: string;
}

/**
 * Document checklist completion status.
 */
export interface DocumentStatusItem {
  status: 'MISSING' | 'COMPLETED';
  updatedAt: string;
}

/**
 * users/{uid}/workflowProgress/{serviceId}
 * Tracks step execution, AI answers, and checklists.
 */
export interface WorkflowProgressDoc {
  serviceId: string; // Matches the serviceId document ID
  currentStep: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  answers: Record<string, AnswerItem>; // Keyed by questionId
  documentStatuses: Record<string, DocumentStatusItem>; // Keyed by documentId
  updatedAt: string;
}
