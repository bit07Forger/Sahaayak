const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('sahaayak_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data as T;
}

export interface UserPreferences {
  textSize: string;
  contrast: string;
  voiceSpeed: string;
  voiceEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  preferences: UserPreferences;
  progress: {
    currentStep: number;
    status: string;
  };
}

export interface ServiceWorkflow {
  service: {
    id: string;
    key: string;
    name: string;
    description: string;
  };
  currentStep: number;
  status: string;
  questions: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    description: string;
    order: number;
  }>;
  answers: Record<string, {
    questionId: string;
    rawValue: string;
    interpretedValue: string;
    isConfirmed: boolean;
  }>;
}

export interface DocumentItem {
  key: string;
  label: string;
  description: string;
  type: 'REQUIRED' | 'OPTIONAL';
  status: 'MISSING' | 'COMPLETED';
}

export interface ReadinessSummary {
  isReady: boolean;
  completedQuestionsCount: number;
  totalQuestionsCount: number;
  missingQuestions: Array<{ key: string; label: string }>;
  missingDocuments: Array<{ key: string; label: string }>;
  summaryStatus: string;
}

export const api = {
  // Session API
  getMe: () => request<{ user: UserProfile }>('/auth/me'),

  updatePreferences: (prefs: Partial<UserPreferences>) =>
    request<{ success: boolean; preferences: UserPreferences }>('/auth/preferences', {
      method: 'POST',
      body: JSON.stringify(prefs),
    }),

  // Workflow API
  getCurrentWorkflow: () => request<ServiceWorkflow>('/workflows/current'),

  // Answers API
  interpretAnswer: (questionKey: string, rawInput: string) =>
    request<{ interpretedValue: string; warning?: string }>('/answers/interpret', {
      method: 'POST',
      body: JSON.stringify({ questionKey, rawInput }),
    }),

  confirmAnswer: (questionKey: string, rawValue: string, interpretedValue: string) =>
    request<{ success: boolean; nextStep: number; workflowStatus: string }>('/answers/confirm', {
      method: 'POST',
      body: JSON.stringify({ questionKey, rawValue, interpretedValue }),
    }),

  validateAnswer: (questionKey: string, value: string) =>
    request<{ isValid: boolean; error: string | null }>('/answers/validate', {
      method: 'POST',
      body: JSON.stringify({ questionKey, value }),
    }),

  // Documents API
  getDocuments: () => request<DocumentItem[]>('/documents/checklist'),

  updateDocumentStatus: (documentKey: string, status: 'MISSING' | 'COMPLETED') =>
    request<{ success: boolean }>('/documents/update', {
      method: 'POST',
      body: JSON.stringify({ documentKey, status }),
    }),

  // Readiness API
  getReadiness: () => request<ReadinessSummary>('/readiness'),
};
