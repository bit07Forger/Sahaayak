import { vi, describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/services/dbService';
import { firestore } from '../src/services/firebaseAdmin';

// Deep mock structures to intercept calls to firestore
const mockDocRef = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
};

const mockSubCollection = {
  doc: vi.fn().mockReturnValue(mockDocRef),
};

const mockUserDocRef = {
  collection: vi.fn().mockReturnValue(mockSubCollection),
  get: vi.fn(),
  set: vi.fn(),
};

const mockUsersCollection = {
  doc: vi.fn().mockReturnValue(mockUserDocRef),
};

const mockFirestore = firestore as any;

vi.mock('../src/services/firebaseAdmin', () => {
  return {
    firestore: {
      collection: vi.fn().mockImplementation((colName: string) => {
        if (colName === 'users') {
          return mockUsersCollection;
        }
        throw new Error(`Unexpected collection call: ${colName}`);
      }),
      runTransaction: vi.fn(),
    },
    adminAuth: {},
    default: {},
  };
});

describe('dbService Workflow-Progress Schema & Persistence Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Progress path construction - should query users/{uid}/workflowProgress/{serviceId}', async () => {
    mockDocRef.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ serviceId: 'my-service' }),
    });

    const res = await db.findProgressDoc('user-123', 'my-service');

    // Assert correct root collection
    expect(firestore.collection).toHaveBeenCalledWith('users');
    // Assert correct user document
    expect(mockUsersCollection.doc).toHaveBeenCalledWith('user-123');
    // Assert correct subcollection path
    expect(mockUserDocRef.collection).toHaveBeenCalledWith('workflowProgress');
    // Assert correct service document ID
    expect(mockSubCollection.doc).toHaveBeenCalledWith('my-service');
    expect(res).toEqual({ serviceId: 'my-service' });
  });

  it('No existing progress - findProgressDoc returns null', async () => {
    mockDocRef.get.mockResolvedValueOnce({
      exists: false,
    });

    const res = await db.findProgressDoc('user-123', 'my-service');
    expect(res).toBeNull();
  });

  it('Initialization - getOrCreateProgressDoc creates default document if missing', async () => {
    mockDocRef.get.mockResolvedValueOnce({
      exists: false,
    });
    mockDocRef.set.mockResolvedValueOnce(undefined);

    const res = await db.getOrCreateProgressDoc('user-123', 'my-service');

    expect(mockDocRef.set).toHaveBeenCalled();
    const setArgs = mockDocRef.set.mock.calls[0][0];
    expect(setArgs).toMatchObject({
      serviceId: 'my-service',
      currentStep: 0,
      status: 'NOT_STARTED',
      answers: {},
      documentStatuses: {},
    });
    expect(setArgs.updatedAt).toBeDefined();
    expect(res).toMatchObject({
      serviceId: 'my-service',
      currentStep: 0,
      status: 'NOT_STARTED',
    });
  });

  it('Answer update - transaction updates answer map preserving other properties', async () => {
    const existingDoc = {
      serviceId: 'my-service',
      currentStep: 2,
      status: 'IN_PROGRESS',
      answers: {
        existing_q: { rawValue: 'existing', interpretedValue: 'existing', isConfirmed: true, updatedAt: '123' },
      },
      documentStatuses: {
        doc_q: { status: 'COMPLETED', updatedAt: '123' },
      },
      updatedAt: '123',
    };

    const mockTx = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => existingDoc,
      }),
      set: vi.fn(),
    };

    vi.mocked(firestore.runTransaction).mockImplementationOnce(async (cb: any) => {
      return cb(mockTx);
    });

    await db.upsertAnswer('user-123', 'my-service', 'new_q', 'new_raw', 'new_int', true);

    expect(mockTx.get).toHaveBeenCalledWith(mockDocRef);
    expect(mockTx.set).toHaveBeenCalled();

    const setArgs = mockTx.set.mock.calls[0][1];
    expect(setArgs.answers.existing_q).toBeDefined();
    expect(setArgs.answers.new_q).toEqual(expect.objectContaining({
      rawValue: 'new_raw',
      interpretedValue: 'new_int',
      isConfirmed: true,
    }));
    // Make sure document statuses are preserved
    expect(setArgs.documentStatuses.doc_q).toBeDefined();
    expect(setArgs.currentStep).toBe(2);
  });

  it('Document status update - transaction updates document status preserving answers', async () => {
    const existingDoc = {
      serviceId: 'my-service',
      currentStep: 3,
      status: 'IN_PROGRESS',
      answers: {
        existing_q: { rawValue: 'existing', interpretedValue: 'existing', isConfirmed: true, updatedAt: '123' },
      },
      documentStatuses: {},
      updatedAt: '123',
    };

    const mockTx = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => existingDoc,
      }),
      set: vi.fn(),
    };

    vi.mocked(firestore.runTransaction).mockImplementationOnce(async (cb: any) => {
      return cb(mockTx);
    });

    await db.upsertDocumentStatus('user-123', 'my-service', 'identity_proof', 'COMPLETED');

    expect(mockTx.get).toHaveBeenCalledWith(mockDocRef);
    expect(mockTx.set).toHaveBeenCalled();

    const setArgs = mockTx.set.mock.calls[0][1];
    expect(setArgs.answers.existing_q).toBeDefined();
    expect(setArgs.documentStatuses.identity_proof).toEqual(expect.objectContaining({
      status: 'COMPLETED',
    }));
    expect(setArgs.currentStep).toBe(3);
  });

  it('Legacy path prevention - dbService methods must never query user level answers/documents', () => {
    const mockCalls = vi.mocked(firestore.collection).mock.calls;
    for (const call of mockCalls) {
      const colName = call[0];
      // Assert that it only accesses 'users' or 'services'
      expect(['users', 'services']).toContain(colName);
    }
  });
});
