import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID,
    });
}

export const adminAuth = admin.auth();
