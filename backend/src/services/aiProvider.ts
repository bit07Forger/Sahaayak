import { GoogleGenAI } from '@google/genai';

/**
 * Interface representing the text generation request contract
 */
export interface AITextGenerationRequest {
  systemInstruction: string;
  userMessage: string;
  context: Array<{ title: string; content: string; sourceId: string }>;
}

/**
 * Interface representing the text generation response contract
 */
export interface AITextGenerationResult {
  text: string;
  provider: 'gemini';
  model: string;
}

export type AIErrorCategory = 'unavailable' | 'timeout' | 'invalid_response' | 'internal_error';

/**
 * Custom normalized error class for backend AI operations
 */
export class AIProviderError extends Error {
  constructor(
    public category: AIErrorCategory,
    message: string
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

let genAIClient: GoogleGenAI | null = null;

/**
 * Resolves the GoogleGenAI SDK client, lazily validating configurations
 */
function getGenAIClient(): GoogleGenAI {
  if (process.env.USE_MOCK_AI === 'true') {
    throw new AIProviderError('unavailable', 'AI provider is disabled (USE_MOCK_AI=true).');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIProviderError('unavailable', 'Missing GEMINI_API_KEY environment variable.');
  }

  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey });
    } catch (err: any) {
      throw new AIProviderError('internal_error', `Failed to initialize Gemini GenAI client: ${err.message || err}`);
    }
  }

  return genAIClient;
}

/**
 * Generates a text response from the configured AI provider
 */
export async function generateText(request: AITextGenerationRequest): Promise<AITextGenerationResult> {
  const client = getGenAIClient();
  const modelName = 'gemini-3.6-flash';

  // Build the context string
  const contextStr = request.context.length > 0
    ? '\n\nApproved Source Context:\n' + request.context.map(c => `[${c.sourceId}] ${c.title}: ${c.content}`).join('\n')
    : '';

  // Construct standard instruction prompt structure
  const prompt = `${request.systemInstruction}${contextStr}\n\nUser Question: ${request.userMessage}`;

  try {
    const interaction = await client.interactions.create({
      model: modelName,
      input: prompt,
    });

    const outputText = interaction.output_text || '';
    if (!outputText.trim()) {
      throw new AIProviderError('invalid_response', 'Gemini SDK returned an empty string.');
    }

    return {
      text: outputText,
      provider: 'gemini',
      model: modelName,
    };
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      throw err;
    }

    const errMsg = err.message || '';

    // Handle standard network or quota timeouts
    if (errMsg.includes('timeout') || errMsg.includes('deadline')) {
      throw new AIProviderError('timeout', 'AI request timed out.');
    }

    // Map quota or limits exhaustion
    if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('429')) {
      throw new AIProviderError('unavailable', 'AI provider quota limit reached.');
    }

    // Map authentication errors
    if (errMsg.includes('API key') || errMsg.includes('key not valid') || errMsg.includes('403') || errMsg.includes('401')) {
      throw new AIProviderError('unavailable', 'AI provider authentication failed.');
    }

    throw new AIProviderError('internal_error', `Gemini SDK generated an error: ${errMsg}`);
  }
}
