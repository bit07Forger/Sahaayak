import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ACTIVE_SERVICE } from '../services/dbService';
import {
  evaluateSafetyPolicy,
  validateAndSanitizeModelOutput,
  checkRateLimit
} from '../services/chatbotSafety';
import { generateText } from '../services/aiProvider';

export async function handleChat(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in to access the chatbot.' });
    }

    const { message, serviceId } = req.body || {};
    const targetServiceId = serviceId || ACTIVE_SERVICE.key;

    // 1. Rate Limit Enforcement
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      console.log(`[Chat Audit] Request ID: ${req.requestId}, User: ${userId}, Status: rate_limited`);
      return res.status(429).json({
        status: 'rate_limited',
        message: 'You have sent too many requests. Please wait a minute before asking another question.',
        requestId: req.requestId,
      });
    }

    // 2. Input Safety Policy Evaluation
    const decision = evaluateSafetyPolicy({
      serviceId: targetServiceId,
      message: message || '',
      conversation: [],
    });

    if (decision.action === 'invalid') {
      console.log(`[Chat Audit] Request ID: ${req.requestId}, User: ${userId}, Status: invalid_request`);
      return res.status(400).json({
        status: 'invalid_request',
        message: decision.error,
        requestId: req.requestId,
      });
    }

    if (decision.action === 'refuse') {
      console.log(`[Chat Audit] Request ID: ${req.requestId}, User: ${userId}, Status: refusal`);
      return res.status(200).json({
        status: 'refusal',
        message: decision.response.answer,
        sources: decision.response.sources || [],
        requestId: req.requestId,
      });
    }

    // 3. Provider Call / Mock Handling
    const useMock = process.env.USE_MOCK_AI === 'true' || !process.env.GEMINI_API_KEY;

    if (useMock) {
      console.log(`[Chat Audit] Request ID: ${req.requestId}, User: ${userId}, Status: answered (mock)`);
      return res.status(200).json({
        status: 'answered',
        message: 'Sahaayak Guidance: You can prepare your scholarship application by organizing your profile, academic direction, motivation statement, and document checklist in the guided form.',
        sources: [
          { label: 'Scholarship Preparation Overview' }
        ],
        requestId: req.requestId,
      });
    }

    try {
      const aiResult = await generateText({
        systemInstruction: 'You are Sahaayak, an accessible scholarship preparation assistant. Provide plain text guidance on application preparation only.',
        userMessage: decision.sanitizedInput.message,
        context: [
          {
            title: 'Scholarship Preparation Overview',
            content: 'The Scholarship Preparation module helps students organize personal details, academic goals, motivation statements, and document checklists before applying.',
            sourceId: 'scholarship-overview'
          }
        ],
      });

      const sanitized = validateAndSanitizeModelOutput(aiResult.text);
      console.log(`[Chat Audit] Request ID: ${req.requestId}, User: ${userId}, Status: ${sanitized.status}`);
      return res.status(200).json({
        status: sanitized.status,
        message: sanitized.answer,
        sources: [
          { label: 'Scholarship Preparation Overview' }
        ],
        requestId: req.requestId,
      });
    } catch (err) {
      console.error(`[Chat Audit Error] Request ID: ${req.requestId}, Provider Error:`, err);
      return res.status(200).json({
        status: 'unavailable',
        message: 'The chatbot service is temporarily unavailable. You can complete the guided questions manually using the standard inputs on the screen.',
        sources: [],
        requestId: req.requestId,
      });
    }

  } catch (error) {
    console.error('Error handling chat request:', error);
    return res.status(500).json({
      status: 'unavailable',
      message: 'Internal server error processing chat request.',
      requestId: req.requestId,
    });
  }
}
