'use server';

import { DesignDocument, UseCase } from '@/core/models/DesignDocument';
import { VertexAIRepository } from '@/repositories/VertexAIRepository';
import { DesignArchitectService } from '@/services/DesignArchitectService';

import { adminAuth } from '@/config/firebaseAdmin';

// Helper to init service with server-side credentials (ADC)
const getService = () => {
    const projectId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

    if (!projectId) {
        throw new Error("Missing Project ID. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local");
    }
    const location = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION || 'europe-north1';

    const vertexRepo = new VertexAIRepository(projectId, location);
    return new DesignArchitectService(vertexRepo);
};

export async function analyzeChatAction(document: DesignDocument, chatLog: string, userToken: string): Promise<{ document: DesignDocument, reply: string }> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService();
        const result = await service.analyzeChat(document, chatLog);
        return result;
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to analyze chat: ${error.message}`);
    }
}

export async function generateDomainModelAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService();
        const updatedDoc = await service.generateDomainModel(document);
        return updatedDoc;
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to generate domain model: ${error.message}`);
    }
}

export async function generateSystemArchitectureAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService();
        const updatedDoc = await service.generateSystemArchitecture(document);
        return updatedDoc;
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to generate system architecture: ${error.message}`);
    }
}

export async function generateObjectDesignAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService();
        const updatedDoc = await service.generateObjectDesign(document);
        return updatedDoc;
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to generate object design: ${error.message}`);
    }
}

export async function validateDesignAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        await adminAuth.verifyIdToken(userToken);
        const service = getService();
        return await service.validateDesign(document);
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to validate design: ${error.message}`);
    }
}

export async function generateReportAction(document: DesignDocument, userToken: string): Promise<string> {
    try {
        await adminAuth.verifyIdToken(userToken);
        const service = getService();
        return await service.generateFinalReport(document);
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to generate report: ${error.message}`);
    }
}

export async function exportToGoogleDocsAction(document: DesignDocument, userToken: string): Promise<string> {
    try {
        const decodedToken = await adminAuth.verifyIdToken(userToken);
        const userEmail = decodedToken.email;

        if (!userEmail) {
            throw new Error("User email not found in token. Cannot share Google Doc.");
        }

        const { GoogleDocsService } = await import('@/services/GoogleDocsService');
        const googleService = new GoogleDocsService();
        const docUrl = await googleService.createDesignDoc(document, userEmail);

        return docUrl;
    } catch (error: any) {
        console.error("Export Error:", error);
        throw new Error(`Failed to export to Google Docs: ${error.message}`);
    }
}
