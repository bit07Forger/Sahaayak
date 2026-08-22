import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db, ACTIVE_SERVICE } from '../services/dbService';

// 1. Get Checklist with user status
export async function getChecklist(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const dbDocuments = ACTIVE_SERVICE.documents;

    // Get user's document statuses from Firestore workflowProgress document
    const progressDoc = await db.getOrCreateProgressDoc(userId, ACTIVE_SERVICE.key);

    // Map statuses
    const statusMap = new Map<string, string>();
    if (progressDoc.documentStatuses) {
      Object.entries(progressDoc.documentStatuses).forEach(([docKey, docVal]) => {
        statusMap.set(docKey, docVal.status);
      });
    }

    // Combine documents with statuses
    const checklist = dbDocuments.map((doc) => ({
      key: doc.key,
      label: doc.label,
      description: doc.description,
      type: doc.type, // REQUIRED, OPTIONAL
      status: statusMap.get(doc.key) || 'MISSING', // MISSING, COMPLETED
    }));

    return res.status(200).json(checklist);
  } catch (error) {
    console.error('Error fetching document checklist:', error);
    return res.status(500).json({ error: 'Internal server error fetching document checklist.' });
  }
}

// 2. Update Document Status
export async function updateDocumentStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { documentKey, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!documentKey || !status) {
      return res.status(400).json({ error: 'documentKey and status are required.' });
    }

    if (status !== 'MISSING' && status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Status must be MISSING or COMPLETED.' });
    }

    // Verify document exists
    const docExists = ACTIVE_SERVICE.documents.some((d) => d.key === documentKey);
    if (!docExists) {
      return res.status(404).json({ error: 'Document key not found.' });
    }

    // Update status in Firestore workflowProgress document
    await db.upsertDocumentStatus(userId, ACTIVE_SERVICE.key, documentKey, status);

    return res.status(200).json({ success: true, message: 'Document status updated.' });
  } catch (error) {
    console.error('Error updating document status:', error);
    return res.status(500).json({ error: 'Internal server error updating document status.' });
  }
}
