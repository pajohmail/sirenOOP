'use client';

import { AuthGuard } from '@/presentation/components/auth/AuthGuard';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ProjectWizard } from '@/presentation/components/wizard/ProjectWizard';
import { DesignDocument } from '@/core/models/DesignDocument';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const { user, signOut, getIdToken } = useAuth();

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
                        <ProjectDemoWrapper userId={user?.uid || 'anon'} getIdToken={getIdToken} />
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}

const ProjectDemoWrapper = ({ userId, getIdToken }: { userId: string, getIdToken: () => Promise<string> }) => {
    // In a real app, we would fetch the project list here.
    const [doc, setDoc] = useState<DesignDocument>({
        id: 'demo-1',
        userId,
        projectName: 'Demo Project',
        description: 'A new project',
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

    const [userToken, setUserToken] = useState<string>('');

    // Fetch fresh token on mount/user change
    useEffect(() => {
        if (userId !== 'anon') {
            getIdToken().then(token => {
                setUserToken(token);
            }).catch(err => console.error("Failed to get token", err));
        }
    }, [userId, getIdToken]);

    const handleUpdate = async (newDoc: DesignDocument) => {
        setDoc(newDoc);
        try {
            // Dynamically import to avoid server-side issues with Firebase Client SDK if any
            const { db } = await import('@/config/firebase');
            const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
            // const repo = new FirestoreRepository(db); // Unused for now
            console.log("Persisting document...", newDoc);
        } catch (e) {
            console.error("Failed to persist", e);
        }
    };

    return (
        <div>
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">Active Project: {doc.projectName}</h2>
                <span className="text-sm text-gray-500">ID: {doc.id}</span>
            </div>
            <ProjectWizard document={doc} onUpdate={handleUpdate} userToken={userToken} />
        </div>
    );
};
