'use server';

import { DesignDocument, UseCase } from '@/core/models/DesignDocument';
import { VertexAIRepository } from '@/repositories/VertexAIRepository';
import { DesignArchitectService } from '@/services/DesignArchitectService';
import { AuthenticationError } from '@/core/errors/ApplicationErrors';
import { handleError, logError } from '@/core/utils/errorHandler';
import { config } from '@/config/appConfig';

import { adminAuth } from '@/config/firebaseAdmin';

// Helper to init service with server-side credentials (ADC)
const getService = (userToken?: string) => {
    const projectId = config.googleCloud.projectId;
    const location = config.googleCloud.location;

    const vertexRepo = new VertexAIRepository(projectId, location, userToken);
    return new DesignArchitectService(vertexRepo);
};

export async function analyzeChatAction(document: DesignDocument, chatLog: string, userToken: string): Promise<{ document: DesignDocument, reply: string }> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService(userToken);
        const result = await service.analyzeChat(document, chatLog);
        return result;
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'analyzeChatAction', documentId: document.id });

        // Re-throw for client to handle
        throw new Error(`Failed to analyze chat: ${appError.message}`);
    }
}

export async function generateDomainModelAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService(userToken);
        const updatedDoc = await service.generateDomainModel(document);
        return updatedDoc;
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'generateDomainModelAction', documentId: document.id });
        throw new Error(`Failed to generate domain model: ${appError.message}`);
    }
}

export async function generateSystemArchitectureAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService(userToken);
        const updatedDoc = await service.generateSystemArchitecture(document);
        return updatedDoc;
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'generateSystemArchitectureAction', documentId: document.id });
        throw new Error(`Failed to generate system architecture: ${appError.message}`);
    }
}

export async function generateObjectDesignAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        // Verify user authentication server-side
        await adminAuth.verifyIdToken(userToken);

        const service = getService(userToken);
        const updatedDoc = await service.generateObjectDesign(document);
        return updatedDoc;
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'generateObjectDesignAction', documentId: document.id });
        throw new Error(`Failed to generate object design: ${appError.message}`);
    }
}

export async function validateDesignAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        await adminAuth.verifyIdToken(userToken);
        const service = getService(userToken);
        return await service.validateDesign(document);
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'validateDesignAction', documentId: document.id });
        throw new Error(`Failed to validate design: ${appError.message}`);
    }
}

export async function generateReportAction(document: DesignDocument, userToken: string): Promise<string> {
    try {
        await adminAuth.verifyIdToken(userToken);
        const service = getService(userToken);
        return await service.generateFinalReport(document);
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'generateReportAction', documentId: document.id });
        throw new Error(`Failed to generate report: ${appError.message}`);
    }
}

export async function exportToGoogleDocsAction(document: DesignDocument, userToken: string): Promise<string> {
    try {
        const decodedToken = await adminAuth.verifyIdToken(userToken);
        const userEmail = decodedToken.email;

        if (!userEmail) {
            throw new AuthenticationError("User email not found in token. Cannot share Google Doc.");
        }

        const { GoogleDocsService } = await import('@/services/GoogleDocsService');
        const googleService = new GoogleDocsService();
        const docUrl = await googleService.createDesignDoc(document, userEmail);

        return docUrl;
    } catch (error) {
        const appError = handleError(error);
        logError(appError, { action: 'exportToGoogleDocsAction', documentId: document.id });
        throw new Error(`Failed to export to Google Docs: ${appError.message}`);
    }
}
