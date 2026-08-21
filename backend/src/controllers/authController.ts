import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../services/dbService';

// 1. Get Me / Session Synchronization
export async function getMe(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const userEmail = req.userEmail || '';

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Attempt to locate user in Firestore
    let user = await db.findUserById(userId);

    // If first-time login/register, seed default Firestore records
    if (!user) {
      console.log(`[Firestore] Seeding first-time profile for UID: ${userId}`);
      user = await db.createUser(userId, userEmail);
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error('Error in getMe controller:', error);
    return res.status(500).json({ error: 'Internal server error retrieving session profile.' });
  }
}

// 2. Update Accessibility Preferences
export async function updatePreferences(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { textSize, contrast, voiceSpeed, voiceEnabled } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const updatedPrefs = await db.upsertPreferences(userId, {
      textSize,
      contrast,
      voiceSpeed,
      voiceEnabled,
    });

    return res.status(200).json({
      success: true,
      preferences: updatedPrefs,
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({ error: 'Internal server error updating preferences.' });
  }
}
