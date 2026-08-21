import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db, ACTIVE_SERVICE } from '../services/dbService';

export async function getReadiness(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const dbQuestions = ACTIVE_SERVICE.questions;
    const dbDocuments = ACTIVE_SERVICE.documents;

    // Fetch user answers from Firestore subcollection
    const userAnswers = await db.findAnswersByUserId(userId);
    const confirmedAnswerKeys = new Set(
      userAnswers.filter((a) => a.isConfirmed).map((a) => a.questionKey)
    );

    // Fetch user documents status from Firestore subcollection
    const userDocs = await db.findDocumentStatusesByUserId(userId);
    const completedDocKeys = new Set(
      userDocs.filter((d) => d.status === 'COMPLETED').map((d) => d.documentKey)
    );

    // Find missing items
    const missingQuestions = dbQuestions
      .filter((q) => !confirmedAnswerKeys.has(q.key))
      .map((q) => ({ key: q.key, label: q.label }));

    const missingDocuments = dbDocuments
      .filter((d) => d.type === 'REQUIRED' && !completedDocKeys.has(d.key))
      .map((d) => ({ key: d.key, label: d.label }));

    const isReady = missingQuestions.length === 0 && missingDocuments.length === 0;

    return res.status(200).json({
      isReady,
      completedQuestionsCount: confirmedAnswerKeys.size,
      totalQuestionsCount: dbQuestions.length,
      missingQuestions,
      missingDocuments,
      summaryStatus: isReady ? 'Ready to submit' : 'More information required',
    });
  } catch (error) {
    console.error('Error calculating readiness:', error);
    return res.status(500).json({ error: 'Internal server error calculating readiness.' });
  }
}
