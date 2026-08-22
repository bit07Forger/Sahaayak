import { createWorker } from 'tesseract.js';

export interface OcrCandidateFields {
  schoolOrCollege?: string;
  fieldOfStudy?: string;
  studyLevel?: string;
  academicStrengths?: string;
}

export interface OcrScanResult {
  status: 'success' | 'rejected' | 'error' | 'empty';
  rawText?: string;
  candidates?: OcrCandidateFields;
  errorMessage?: string;
  confidence?: number;
}

// Sensitive Document Rejection Keywords
const SENSITIVE_KEYWORDS = [
  'aadhaar', 'uidai', 'passport', 'driver license', 'driver licence', 'driving license',
  'pan card', 'voter id', 'bank statement', 'account number', 'credit card', 'debit card',
  'medical certificate', 'disability certificate', 'social security', 'ssn', 'tax return',
  'national id', 'government id'
];

/**
 * Validates file type and size before processing.
 * Max allowed size: 5MB (5 * 1024 * 1024 bytes)
 */
export function validateOcrFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Unsupported file format. Please select a JPG, PNG, or WebP image file.';
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return 'File size exceeds the 5 MB limit. Please select a smaller preparation note image.';
  }

  // Check filename for sensitive document indicators
  const lowerName = file.name.toLowerCase();
  if (SENSITIVE_KEYWORDS.some(kw => lowerName.includes(kw))) {
    return 'Unsupported document type: For privacy and safety, official identity cards, bank statements, tax records, and medical certificates cannot be scanned. Please upload only a user-created academic preparation summary note.';
  }

  return null;
}

/**
 * Executes browser-only OCR text extraction on the provided image file using Tesseract.js.
 * All processing runs locally in memory.
 */
export async function performBrowserOcr(
  file: File,
  onProgress?: (progress: number, statusText: string) => void
): Promise<OcrScanResult> {
  const fileErr = validateOcrFile(file);
  if (fileErr) {
    return { status: 'rejected', errorMessage: fileErr };
  }

  let worker: any = null;
  let objectUrl: string | null = null;

  try {
    objectUrl = URL.createObjectURL(file);

    if (onProgress) onProgress(10, 'Initializing local browser OCR engine...');

    // Create local Tesseract worker
    worker = await createWorker('eng');

    if (onProgress) onProgress(40, 'Scanning local preparation note image...');

    const ret = await worker.recognize(objectUrl);
    const text = (ret.data?.text || '').trim();
    const confidence = ret.data?.confidence || 0;

    if (onProgress) onProgress(90, 'Analyzing candidate text fields...');

    if (!text || text.length < 5) {
      return {
        status: 'empty',
        errorMessage: 'Could not extract readable text from this preparation note. Please ensure the note is well-lit and legible.',
        confidence,
      };
    }

    // Safety Check: Verify extracted text does not contain sensitive identity keywords
    const lowerText = text.toLowerCase();
    if (SENSITIVE_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return {
        status: 'rejected',
        errorMessage: 'Unsupported document type detected: This scan contains keywords associated with official identity, financial, or medical documents. For privacy and safety, please scan only a user-created academic preparation note.',
      };
    }

    // Extract Candidate Non-Sensitive Fields
    const candidates = extractCandidateFields(text);

    if (onProgress) onProgress(100, 'Scan complete.');

    return {
      status: 'success',
      rawText: text,
      candidates,
      confidence,
    };
  } catch (err: any) {
    console.error('Browser OCR processing error:', err);
    return {
      status: 'error',
      errorMessage: err.message || 'An error occurred during local image scanning. You can continue by typing your responses manually.',
    };
  } finally {
    // Terminate worker to free memory
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // Ignore termination cleanup warnings
      }
    }
    // Revoke object URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

/**
 * Deterministic helper to parse non-sensitive candidate text from recognized lines.
 */
function extractCandidateFields(rawText: string): OcrCandidateFields {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const result: OcrCandidateFields = {};

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 1. School or College Name candidate
    if (!result.schoolOrCollege && (lower.includes('school') || lower.includes('college') || lower.includes('university') || lower.includes('institute') || lower.includes('academy'))) {
      result.schoolOrCollege = line.replace(/^(school|college|university|institution):\s*/i, '').trim();
    }

    // 2. Field of Study candidate
    if (!result.fieldOfStudy && (lower.includes('course') || lower.includes('field') || lower.includes('major') || lower.includes('department') || lower.includes('engineering') || lower.includes('computer') || lower.includes('science') || lower.includes('commerce') || lower.includes('arts'))) {
      result.fieldOfStudy = line.replace(/^(course|field|major|degree|study):\s*/i, '').trim();
    }

    // 3. Study Level candidate
    if (!result.studyLevel) {
      if (lower.includes('high school') || lower.includes('grade 12') || lower.includes('12th')) {
        result.studyLevel = 'High School / Grade 12';
      } else if (lower.includes('undergraduate') || lower.includes('bachelor') || lower.includes('b.tech') || lower.includes('b.sc') || lower.includes('b.com')) {
        result.studyLevel = 'Undergraduate Degree';
      } else if (lower.includes('postgraduate') || lower.includes('master') || lower.includes('m.tech') || lower.includes('m.sc')) {
        result.studyLevel = 'Postgraduate Degree';
      } else if (lower.includes('diploma') || lower.includes('vocational')) {
        result.studyLevel = 'Diploma / Vocational Training';
      }
    }

    // 4. Academic Strengths candidate
    if (!result.academicStrengths && (lower.includes('strength') || lower.includes('subject') || lower.includes('interest') || lower.includes('math') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('english'))) {
      result.academicStrengths = line.replace(/^(strengths|subjects|interests|skills):\s*/i, '').trim();
    }
  }

  // Fallback: If no candidate extracted, use first clean non-empty line as field of study candidate
  if (!result.schoolOrCollege && !result.fieldOfStudy && lines.length > 0) {
    result.fieldOfStudy = lines[0].slice(0, 100);
  }

  return result;
}
