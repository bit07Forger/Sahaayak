import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthRequest } from '../middleware/auth';
import { db, ACTIVE_SERVICE } from '../services/dbService';

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

    const useMock = process.env.USE_MOCK_AI === 'true' || !process.env.GEMINI_API_KEY;

    if (useMock) {
      console.log(`[AI Mock] Running local interpretation for ${questionKey}`);
      const parsed = runLocalMockInterpretation(questionKey, rawInput);
      return res.status(200).json({ interpretedValue: parsed });
    }

    // Initialize Gemini Interactions API Client
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });

    // Build prompt based on question key
    let formatInstruction = '';
    if (questionKey === 'dob') {
      formatInstruction = 'Extract the date of birth and output ONLY the date in YYYY-MM-DD format. If no year is specified, default to 1995.';
    } else if (questionKey === 'has_impairment') {
      formatInstruction = 'Identify if the user is answering yes or no. Output ONLY "true" or "false".';
    } else if (questionKey === 'doctor_license') {
      formatInstruction = 'Extract the doctor license alphanumeric registration number. Output ONLY the extracted key.';
    } else if (questionKey === 'vehicle_plate') {
      formatInstruction = 'Extract the vehicle license plate alphanumeric registration number. If user is passenger or doesn\'t have one, output "None".';
    } else if (questionKey === 'doctor_name') {
      formatInstruction = 'Extract the physician doctor\'s name. Strip prefixes like Dr. or Doctor. Output ONLY the name.';
    } else {
      formatInstruction = 'Extract the clean, corrected value for this question field.';
    }

    const prompt = `You are a helper parsing accessibility forms.
Question: "${questionKey}"
Instruction: ${formatInstruction}
User Input: "${rawInput}"

Output ONLY the final parsed result. Do not write markdown, do not write code blocks, do not explain.`;

    const interaction = await client.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
    });

    const resultText = interaction.output_text?.trim() || '';
    const finalVal = resultText || runLocalMockInterpretation(questionKey, rawInput);

    return res.status(200).json({ interpretedValue: finalVal });
  } catch (error: any) {
    console.error('Error during AI answer interpretation:', error);
    try {
      const { questionKey, rawInput } = req.body;
      const fallbackVal = runLocalMockInterpretation(questionKey, rawInput);
      return res.status(200).json({
        interpretedValue: fallbackVal,
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
