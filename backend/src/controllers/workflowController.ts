import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db, ACTIVE_SERVICE } from '../services/dbService';

// 1. Get List of Services
export async function getServices(req: AuthRequest, res: Response) {
  try {
    const services = [
      {
        id: ACTIVE_SERVICE.key,
        key: ACTIVE_SERVICE.key,
        name: ACTIVE_SERVICE.name,
        description: ACTIVE_SERVICE.description,
      },
    ];
    return res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'Internal server error fetching services.' });
  }
}

// 2. Get Current Active Workflow & Progress
export async function getCurrentWorkflow(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const progress = await db.findProgressByUserId(userId);
    const answers = await db.findAnswersByUserId(userId);

    // Format answers map for easier frontend consumption
    const formattedAnswers: Record<string, {
      questionId: string;
      rawValue: string;
      interpretedValue: string;
      isConfirmed: boolean;
    }> = {};

    answers.forEach((ans) => {
      formattedAnswers[ans.questionKey] = {
        questionId: ans.questionKey,
        rawValue: ans.rawValue,
        interpretedValue: ans.interpretedValue,
        isConfirmed: ans.isConfirmed,
      };
    });

    return res.status(200).json({
      service: {
        id: ACTIVE_SERVICE.key,
        key: ACTIVE_SERVICE.key,
        name: ACTIVE_SERVICE.name,
        description: ACTIVE_SERVICE.description,
      },
      currentStep: progress.currentStep,
      status: progress.status,
      questions: ACTIVE_SERVICE.questions,
      answers: formattedAnswers,
    });
  } catch (error) {
    console.error('Error fetching current workflow:', error);
    return res.status(500).json({ error: 'Internal server error retrieving workflow state.' });
  }
}
