import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreRepository } from '@/repositories/FirestoreRepository';
import { DesignDocument } from '@/core/models/DesignDocument';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => {
    const docFn = vi.fn();
    const setDocFn = vi.fn();
    const getDocFn = vi.fn();
    const collectionFn = vi.fn();
    const addDocFn = vi.fn();
    const updateDocFn = vi.fn();
    const deleteDocFn = vi.fn();
    const queryFn = vi.fn();
    const whereFn = vi.fn();
    const getDocsFn = vi.fn();

    return {
        getFirestore: vi.fn(() => ({})),
        doc: docFn,
        setDoc: setDocFn,
        getDoc: getDocFn,
        collection: collectionFn,
        addDoc: addDocFn,
        updateDoc: updateDocFn,
        deleteDoc: deleteDocFn,
        query: queryFn,
        where: whereFn,
        getDocs: getDocsFn,
    };
});

describe('FirestoreRepository', () => {
    let repo: FirestoreRepository;
    const mockDb = {} as any;

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new FirestoreRepository(mockDb);
    });

    it('should save a design document and return ID', async () => {
        const { collection, addDoc } = await import('firebase/firestore');
        (collection as unknown as ReturnType<typeof vi.fn>).mockReturnValue('mock-collection-ref');
        (addDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'generated-id' });

        const documentData = {
            userId: 'user-1',
            title: 'Test Doc',
            content: { originalBrief: 'brief' },
            status: 'draft' as const,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const id = await repo.saveDesignDocument(documentData);

        expect(collection).toHaveBeenCalledWith(mockDb, 'designDocuments');
        expect(addDoc).toHaveBeenCalledWith('mock-collection-ref', documentData);
        expect(id).toBe('generated-id');
    });

    it('should get a design document by ID', async () => {
        const { doc, getDoc } = await import('firebase/firestore');
        (doc as unknown as ReturnType<typeof vi.fn>).mockReturnValue('mock-doc-ref');
        (getDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            exists: () => true,
            id: 'doc-1',
            data: () => ({ userId: 'user-1', title: 'Test Doc' })
        });

        const result = await repo.getDesignDocument('doc-1');

        expect(result).toEqual({ id: 'doc-1', userId: 'user-1', title: 'Test Doc' });
    });

    it('should return null if design document does not exist', async () => {
        const { getDoc } = await import('firebase/firestore');
        (getDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            exists: () => false
        });

        const result = await repo.getDesignDocument('doc-id');
        expect(result).toBeNull();
    });

    it('should update a design document', async () => {
        const { doc, updateDoc } = await import('firebase/firestore');
        (doc as unknown as ReturnType<typeof vi.fn>).mockReturnValue('mock-doc-ref');

        await repo.updateDesignDocument('doc-1', { title: 'Updated' });

        expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { title: 'Updated' });
    });

    it('should delete a design document', async () => {
        const { doc, deleteDoc } = await import('firebase/firestore');
        (doc as unknown as ReturnType<typeof vi.fn>).mockReturnValue('mock-doc-ref');

        await repo.deleteDesignDocument('doc-1');

        expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('should get user design documents', async () => {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        (getDocs as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            docs: [
                { id: '1', data: () => ({ title: 'Doc 1' }) },
                { id: '2', data: () => ({ title: 'Doc 2' }) }
            ],
            forEach: (callback: (doc: any) => void) => {
                [
                    { id: '1', data: () => ({ title: 'Doc 1' }) },
                    { id: '2', data: () => ({ title: 'Doc 2' }) }
                ].forEach(callback);
            }
        });

        const results = await repo.getUserDesignDocuments('user-1');

        expect(collection).toHaveBeenCalledWith(mockDb, 'designDocuments');
        expect(where).toHaveBeenCalledWith('userId', '==', 'user-1');
        expect(query).toHaveBeenCalled();
        expect(results).toHaveLength(2);
        expect(results[0].id).toBe('1');
    });
});
