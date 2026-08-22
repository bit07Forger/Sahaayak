import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthRequest } from '../middleware/auth';
import { db, ACTIVE_SERVICE } from '../services/dbService';
// Simple in-memory cache for repeated AI interpretations
const interpretationCache = new Map<string, any>();
function getCacheKey(questionKey: string, rawInput: string): string {
  return `${questionKey}::${rawInput.trim().toLowerCase()}`;
}

// Deterministic Validation Helper
function validateAnswer(key: string, value: string): string | null {
  const cleanVal = value.trim();

  if (!cleanVal) {
    return 'Input cannot be empty.';
  }

  switch (key) {
    case 'name':
      if (cleanVal.length < 2) {
        return 'Name must be at least 2 characters long.';
      }
      if (!/^[a-zA-Z\s.-]+$/.test(cleanVal)) {
        return 'Name can only contain letters, spaces, dots, or hyphens.';
      }
      break;

    case 'dob':
      const dobDate = new Date(cleanVal);
      if (isNaN(dobDate.getTime())) {
        return 'Please enter a valid date in YYYY-MM-DD format.';
      }
      const today = new Date();
      if (dobDate > today) {
        return 'Date of birth cannot be in the future.';
      }
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return 'You must be at least 18 years old to apply for this permit.';
      }
      break;

    case 'has_impairment':
      const lowerImp = cleanVal.toLowerCase();
      if (lowerImp !== 'true' && lowerImp !== 'false') {
        return 'Impairment selection must be Yes or No.';
      }
      break;

    case 'doctor_name':
      if (cleanVal.length < 2) {
        return "Physician name must be at least 2 characters long.";
      }
      if (!/^[a-zA-Z\s.-]+$/.test(cleanVal)) {
        return 'Physician name can only contain letters, spaces, dots, or hyphens.';
      }
      break;

    case 'doctor_license':
      if (!/^[a-zA-Z0-9]{6,10}$/.test(cleanVal)) {
        return 'Medical license number must be alphanumeric and between 6 to 10 characters long.';
      }
      break;

    case 'vehicle_plate':
      if (cleanVal.toLowerCase() === 'none') {
        break;
      }
      if (!/^[a-zA-Z0-9\s]{3,10}$/.test(cleanVal)) {
        return 'License plate must be alphanumeric, between 3 to 10 characters, or "None".';
      }
      break;

    default:
      break;
  }

  return null; // No errors
}

// Regex Fallback Parser for Local Match Mode (Demo stability)
function runLocalMockInterpretation(questionKey: string, rawInput: string): string {
  const text = rawInput.trim();
  const lowerText = text.toLowerCase();

  switch (questionKey) {
    case 'name':
      const nameMatch = rawInput.match(/(?:my name is|i am|called)\s+([a-zA-Z\s.-]+)/i);
      return nameMatch ? nameMatch[1].trim() : text;

    case 'dob':
      const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return isoMatch[0];

      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      let foundMonth = -1;
      let day = 1;
      let year = 1990;

      months.forEach((m, idx) => {
        if (lowerText.includes(m)) {
          foundMonth = idx;
        }
      });

      const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) year = parseInt(yearMatch[0], 10);

      const dayMatch = text.match(/\b([123]?\d)(?:st|nd|rd|th)?\b/);
      if (dayMatch) day = parseInt(dayMatch[1], 10);

      if (foundMonth !== -1) {
        const mm = String(foundMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }

      return '1995-05-10';

    case 'has_impairment':
      if (lowerText.includes('yes') || lowerText.includes('yeah') || lowerText.includes('true') || lowerText.includes('i do') || lowerText.includes('have limitation')) {
        return 'true';
      }
      if (lowerText.includes('no') || lowerText.includes('dont') || lowerText.includes('not') || lowerText.includes('false')) {
        return 'false';
      }
      return 'true';

    case 'doctor_name':
      const docMatch = rawInput.match(/(?:dr\.|doctor)\s+([a-zA-Z\s.-]+)/i);
      return docMatch ? docMatch[1].trim() : text;

    case 'doctor_license':
      const licMatch = text.match(/[a-zA-Z0-9]{6,10}/);
      return licMatch ? licMatch[0] : text;

    case 'vehicle_plate':
      if (lowerText.includes('none') || lowerText.includes('no vehicle') || lowerText.includes('passenger')) {
        return 'None';
      }
      const plateMatch = text.match(/[a-zA-Z0-9\s]{3,10}/);
      return plateMatch ? plateMatch[0].toUpperCase().replace(/\s+/g, '') : text;

    default:
      return text;
  }
}

// 1. AI Answer Interpretation Endpoint
export async function interpretAnswer(req: AuthRequest, res: Response) {
  try {
    const { questionKey, rawInput } = req.body;

    if (!questionKey || rawInput === undefined) {
      return res.status(400).json({ error: 'questionKey and rawInput are required.' });
    }

    // Check cache first
    const cacheKey = getCacheKey(questionKey, rawInput);
    if (interpretationCache.has(cacheKey)) {
      return res.status(200).json({ ...interpretationCache.get(cacheKey), source: 'cache' });
    }

    const useMock = process.env.USE_MOCK_AI === 'true' || !process.env.GEMINI_API_KEY;

    // Typed fallback shape used everywhere below, so the frontend always gets the same fields
    const buildResult = (
      value: string,
      confidence: number,
      needsClarification: boolean,
      clarificationQuestion: string | null,
      plainExplanation: string,
      source: string
    ) => ({
      interpretedValue: value,
      confidence,
      needsClarification,
      clarificationQuestion,
      plainExplanation,
      source,
    });

    if (useMock) {
      console.log(`[AI Mock] Running local interpretation for ${questionKey}`);
      const parsed = runLocalMockInterpretation(questionKey, rawInput);
      const result = buildResult(
        parsed,
        0.6,
        false,
        null,
        `We understood this as: ${parsed}`,
        'mock'
      );
      interpretationCache.set(cacheKey, result);
      return res.status(200).json(result);
    }

    // Initialize Gemini Interactions API Client
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });

    // Build prompt based on question key
    let formatInstruction = '';
    if (questionKey === 'dob') {
      formatInstruction = 'Extract the date of birth in YYYY-MM-DD format. If no year is specified, default to 1995.';
    } else if (questionKey === 'has_impairment') {
      formatInstruction = 'Identify if the user is answering yes or no. Value must be exactly "true" or "false".';
    } else if (questionKey === 'doctor_license') {
      formatInstruction = 'Extract the doctor license alphanumeric registration number.';
    } else if (questionKey === 'vehicle_plate') {
      formatInstruction = 'Extract the vehicle license plate alphanumeric registration number. If user is a passenger or has none, value should be "None".';
    } else if (questionKey === 'doctor_name') {
      formatInstruction = "Extract the physician doctor's name. Strip prefixes like Dr. or Doctor.";
    } else {
      formatInstruction = 'Extract the clean, corrected value for this question field.';
    }

    const prompt = `You are a helper parsing accessibility forms for users who may have low digital literacy, visual, hearing, motor, or cognitive impairments.

Question: "${questionKey}"
Instruction: ${formatInstruction}
User Input: "${rawInput}"

Respond with ONLY valid JSON, no markdown, no code fences, no extra text, matching exactly this schema:
{
  "value": string,
  "confidence": number between 0.0 and 1.0,
  "needsClarification": boolean,
  "clarificationQuestion": string or null (only set if needsClarification is true, keep it short and simple),
  "plainExplanation": string (max one short sentence, grade-5 reading level, explaining what you understood)
}

Rules:
- If you are not confident (below 0.7), set needsClarification to true and ask ONE simple clarifying question.
- Never invent information the user did not say.
- Output nothing except the JSON object.`;

    const interaction = await client.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
    });

    const rawText = interaction.output_text?.trim() || '';

    let parsedJson: any;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsedJson = JSON.parse(cleaned);
      if (typeof parsedJson.value !== 'string' || typeof parsedJson.confidence !== 'number') {
        throw new Error('Malformed AI response schema');
      }
    } catch (parseError) {
      console.error('AI returned invalid JSON, using local fallback:', rawText);
      const fallbackVal = runLocalMockInterpretation(questionKey, rawInput);
      const result = buildResult(
        fallbackVal,
        0.4,
        false,
        null,
        `We understood this as: ${fallbackVal}`,
        'fallback_parse_error'
      );
      interpretationCache.set(cacheKey, result);
      return res.status(200).json(result);
    }

    const result = buildResult(
      parsedJson.value,
      parsedJson.confidence,
      parsedJson.needsClarification || false,
      parsedJson.clarificationQuestion || null,
      parsedJson.plainExplanation || `We understood this as: ${parsedJson.value}`,
      'ai'
    );

    interpretationCache.set(cacheKey, result);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error during AI answer interpretation:', error);
    try {
      const { questionKey, rawInput } = req.body;
      const fallbackVal = runLocalMockInterpretation(questionKey, rawInput);
      return res.status(200).json({
        interpretedValue: fallbackVal,
        confidence: 0.3,
        needsClarification: false,
        clarificationQuestion: null,
        plainExplanation: `We understood this as: ${fallbackVal}`,
        source: 'error_fallback',
        warning: 'AI processing failed. Substituted with local match rules.',
      });
    } catch {
      return res.status(500).json({ error: 'Interpretation failure.' });
    }
  }
}

// 2. Confirm & Save Answer Endpoint
export async function confirmAnswer(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { questionKey, rawValue, interpretedValue } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!questionKey || rawValue === undefined || interpretedValue === undefined) {
      return res.status(400).json({ error: 'questionKey, rawValue, and interpretedValue are required.' });
    }

    // Run deterministic validation
    const validationError = validateAnswer(questionKey, interpretedValue);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Save Answer to Firestore workflowProgress document
    await db.upsertAnswer(userId, ACTIVE_SERVICE.key, questionKey, rawValue, interpretedValue, true);

    // Determine current questions list to resolve next steps
    const dbQuestions = ACTIVE_SERVICE.questions;
    const currentIndex = dbQuestions.findIndex((q) => q.key === questionKey);
    let nextStep = currentIndex + 1;

    // Check if workflow is finished
    let progressStatus = 'IN_PROGRESS';
    if (nextStep >= dbQuestions.length) {
      nextStep = dbQuestions.length - 1;
      progressStatus = 'COMPLETED';
    }

    // Update User Progress in Firestore workflowProgress document
    await db.updateProgressState(userId, ACTIVE_SERVICE.key, nextStep, progressStatus as any);

    return res.status(200).json({
      success: true,
      nextStep,
      workflowStatus: progressStatus,
    });
  } catch (error) {
    console.error('Error confirming answer:', error);
    return res.status(500).json({ error: 'Internal server error saving confirmed answer.' });
  }
}

// 3. Separate Manual validation POST endpoint
export async function validateInput(req: AuthRequest, res: Response) {
  try {
    const { questionKey, value } = req.body;
    if (!questionKey || value === undefined) {
      return res.status(400).json({ error: 'questionKey and value are required.' });
    }

    const validationError = validateAnswer(questionKey, value);
    return res.status(200).json({
      isValid: validationError === null,
      error: validationError,
    });
  } catch (error) {
    console.error('Error validating input:', error);
    return res.status(500).json({ error: 'Internal server error during validation.' });
  }
}
