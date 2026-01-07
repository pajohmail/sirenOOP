'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/core/models/User';
import { AuthRepository } from '@/repositories/AuthRepository';
import { auth } from '@/config/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    getIdToken: async () => '',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authRepository] = useState(() => new AuthRepository(auth));

    useEffect(() => {
        const unsubscribe = authRepository.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [authRepository]);

    const signInWithGoogle = async () => {
        try {
            await authRepository.signInWithGoogle();
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await authRepository.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const getIdToken = async (): Promise<string> => {
        try {
            return await authRepository.getUserToken();
        } catch (error) {
            console.error('Error getting token:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
