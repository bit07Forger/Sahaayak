import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Static Schema Consistency & Safety Boundaries', () => {
  it('Active code paths must use workflowProgress/{serviceId} and reject legacy user-level paths', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const controllerDir = path.join(srcDir, 'controllers');
    const serviceDir = path.join(srcDir, 'services');

    const checkFiles = [
      path.join(serviceDir, 'dbService.ts'),
      path.join(controllerDir, 'answerController.ts'),
      path.join(controllerDir, 'documentController.ts'),
      path.join(controllerDir, 'workflowController.ts'),
      path.join(controllerDir, 'readinessController.ts'),
    ];

    for (const filePath of checkFiles) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');

      // 1. Confirm active code paths use workflowProgress
      if (filePath.endsWith('dbService.ts')) {
        expect(content).toContain('workflowProgress');
      }

      // 2. Legacy paths (/answers, /documents) do not appear in active user query flows
      expect(content).not.toContain("collection('answers')");
      expect(content).not.toContain('collection("answers")');
      expect(content).not.toContain(".doc(uid).collection('documents')");
      expect(content).not.toContain('.doc(uid).collection("documents")');
    }
  });

  it('Tested field names agree with existing Firestore model types', () => {
    const firestoreTypesPath = path.resolve(process.cwd(), 'src/types/firestore.ts');
    const content = fs.readFileSync(firestoreTypesPath, 'utf-8');

    // Confirm that WorkflowProgressDoc has serviceId, currentStep, status, answers, documentStatuses
    expect(content).toContain('serviceId: string');
    expect(content).toContain('currentStep: number');
    expect(content).toContain('status:');
    expect(content).toContain('answers: Record<string, AnswerItem>');
    expect(content).toContain('documentStatuses: Record<string, DocumentStatusItem>');
  });

  it('Core dbService files and this test suite have no dependencies on the AI/Chatbot layer', () => {
    const dbServicePath = path.resolve(process.cwd(), 'src/services/dbService.ts');
    const content = fs.readFileSync(dbServicePath, 'utf-8');

    // Confirm core dbService does not import AI/Chatbot modules
    expect(content).not.toContain('aiProvider');
    expect(content).not.toContain('chatbotSafety');
  });
});
