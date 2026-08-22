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

    // Fetch user progress document from Firestore
    const progressDoc = await db.getOrCreateProgressDoc(userId, ACTIVE_SERVICE.key);

    const confirmedAnswerKeys = new Set<string>();
    if (progressDoc.answers) {
      Object.entries(progressDoc.answers).forEach(([qKey, ans]) => {
        if (ans.isConfirmed) {
          confirmedAnswerKeys.add(qKey);
        }
      });
    }

    const completedDocKeys = new Set<string>();
    if (progressDoc.documentStatuses) {
      Object.entries(progressDoc.documentStatuses).forEach(([docKey, docVal]) => {
        if (docVal.status === 'COMPLETED') {
          completedDocKeys.add(docKey);
        }
      });
    }

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
      summaryStatus: isReady ? 'Preparation draft complete' : 'Preparation draft in progress',
    });
  } catch (error) {
    console.error('Error calculating readiness:', error);
    return res.status(500).json({ error: 'Internal server error calculating readiness.' });
  }
}
