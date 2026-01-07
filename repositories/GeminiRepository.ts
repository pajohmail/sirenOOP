import { GoogleGenerativeAI } from '@google/generative-ai';
import { IVertexAIRepository } from './interfaces/IVertexAIRepository';
import { AIGenerationError } from '@/core/errors/ApplicationErrors';
import { handleError } from '@/core/utils/errorHandler';

export class GeminiRepository implements IVertexAIRepository {
    private genAI: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = 'gemini-2.0-flash-exp') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (!text) {
                throw new AIGenerationError('No content generated', {
                    promptLength: prompt.length,
                    response: JSON.stringify(response),
                });
            }

            return text;
        } catch (error) {
            const appError = handleError(error);
            throw new AIGenerationError(
                `Gemini generation failed: ${appError.message}`,
                {
                    originalError: appError.toJSON(),
                    promptLength: prompt.length,
                }
            );
        }
    }

    async generateWithParameters(
        prompt: string,
        temperature?: number,
        maxOutputTokens?: number
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: temperature ?? 0.7,
                    maxOutputTokens: maxOutputTokens ?? 2048,
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (!text) {
                throw new AIGenerationError('No content generated with parameters', {
                    temperature,
                    maxOutputTokens,
                    promptLength: prompt.length,
                });
            }

            return text;
        } catch (error) {
            const appError = handleError(error);
            throw new AIGenerationError(
                `Gemini generation with parameters failed: ${appError.message}`,
                {
                    originalError: appError.toJSON(),
                    temperature,
                    maxOutputTokens,
                    promptLength: prompt.length,
                }
            );
        }
    }
}
