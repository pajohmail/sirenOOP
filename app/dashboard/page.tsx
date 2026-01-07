'use client';

import { AuthGuard } from '@/presentation/components/auth/AuthGuard';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ProjectWizard } from '@/presentation/components/wizard/ProjectWizard';
import { DesignDocument } from '@/core/models/DesignDocument';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-bold text-gray-900">SirenOOP Dashboard</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    {user?.displayName}
                                </span>
                                {user?.photoURL && (
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                        className="h-8 w-8 rounded-full"
                                    />
                                )}
                                <button
                                    onClick={signOut}
                                    className="ml-4 px-4 py-2 text-sm text-red-600 hover:text-red-800"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {/* Temporary Demo State Initialization */}
                        <ProjectDemoWrapper userId={user?.uid || 'anon'} />
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}

const ProjectDemoWrapper = ({ userId }: { userId: string }) => {
    // In a real app, we would fetch the project list here.
    const [doc, setDoc] = useState<DesignDocument>({
        id: crypto.randomUUID(),
        userId,
        projectName: 'My New System', // Improved default name
        description: 'Describe your system here...',
        currentPhase: 'analysis',
        analysis: {
            useCases: [],
            domainModelMermaid: '',
            glossary: [],
            completed: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
    });

    const [isLoading, setIsLoading] = useState(true);

    // Load existing document on mount
    useEffect(() => {
        const loadDocument = async () => {
            if (userId === 'anon') {
                setIsLoading(false);
                return;
            }

            try {
                const { db } = await import('@/config/firebase');
                const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
                const repo = new FirestoreRepository(db);

                // Try to load user's documents
                const docs = await repo.getUserDesignDocuments(userId);
                if (docs.length > 0) {
                    // Load the most recent document
                    const sortedDocs = docs.sort((a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    );
                    setDoc(sortedDocs[0] as DesignDocument);
                    console.log("Loaded existing document", sortedDocs[0].id);
                }
            } catch (error) {
                console.error("Failed to load document", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDocument();
    }, [userId]);

    const handleUpdate = async (newDoc: DesignDocument) => {
        setDoc(newDoc);
        try {
            // Dynamically import to avoid server-side issues with Firebase Client SDK if any
            const { db } = await import('@/config/firebase');
            const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
            const repo = new FirestoreRepository(db);

            // Save to Firestore
            await repo.saveDesignDocument(newDoc);
            console.log("Document persisted successfully", newDoc.id);
        } catch (e) {
            console.error("Failed to persist document", e);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2 w-full">
                    <span className="text-gray-500 font-medium">Project:</span>
                    <input
                        type="text"
                        value={doc.projectName}
                        onChange={(e) => {
                            const updated = { ...doc, projectName: e.target.value };
                            setDoc(updated);
                            // onUpdate(updated); // Optional: if we want to trigger persistence on every keystroke, but maybe distinct save is better. 
                            // For now, local state update is enough for the "Export" button to pick it up later.
                        }}
                        className="font-semibold text-lg text-gray-800 border-none hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex-1 transition-colors"
                        placeholder="Name your project..."
                    />
                </div>
                {/* ID hidden for cleaner UI */}
            </div>
            <ProjectWizard document={doc} onUpdate={handleUpdate} />
        </div>
    );
};
