import { useState } from 'react';
import { DesignDocument } from '@/core/models/DesignDocument';
import { GeminiRepository } from '@/repositories/GeminiRepository';
import { DesignArchitectService } from '@/services/DesignArchitectService';
import { config } from '@/config/appConfig';

export function useDesignArchitect() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getService = () => {
        const geminiRepo = new GeminiRepository(
            config.gemini.apiKey,
            config.gemini.model
        );
        return new DesignArchitectService(geminiRepo);
    };

    const analyzeChat = async (
        document: DesignDocument,
        chatLog: string
    ): Promise<{ document: DesignDocument; reply: string }> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            const result = await service.analyzeChat(document, chatLog);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to analyze chat');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateDomainModel = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateDomainModel(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate domain model');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateSystemArchitecture = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateSystemArchitecture(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate system architecture');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateObjectDesign = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateObjectDesign(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate object design');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const validateDesign = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.validateDesign(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to validate design');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateReport = async (
        document: DesignDocument
    ): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateFinalReport(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate report');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        analyzeChat,
        generateDomainModel,
        generateSystemArchitecture,
        generateObjectDesign,
        validateDesign,
        generateReport,
    };
}
