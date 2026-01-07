import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { IVertexAIRepository } from './interfaces/IVertexAIRepository';
import { AIGenerationError } from '@/core/errors/ApplicationErrors';
import { handleError } from '@/core/utils/errorHandler';
import { config } from '@/config/appConfig';

export class VertexAIRepository implements IVertexAIRepository {
    private vertexAI: VertexAI;
    private model: GenerativeModel;

    constructor(projectId: string, location: string, userToken?: string) {
        // Initialize Vertex AI with Application Default Credentials (ADC)
        // If userToken is provided, use it for authentication
        const authOptions = userToken ? {
            googleAuthOptions: {
                credentials: { access_token: userToken }
            }
        } : {};

        this.vertexAI = new VertexAI({
            project: projectId,
            location: location,
            ...authOptions
        });

        this.model = this.vertexAI.getGenerativeModel({
            model: config.vertexAI.model,
        });
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.candidates?.[0].content.parts[0].text;

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
                `Vertex AI generation failed: ${appError.message}`,
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
            const model = this.vertexAI.getGenerativeModel({
                model: config.vertexAI.model,
                generationConfig: {
                    temperature: temperature ?? config.vertexAI.temperature,
                    maxOutputTokens: maxOutputTokens ?? config.vertexAI.maxTokens,
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.candidates?.[0].content.parts[0].text;

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
                `Vertex AI generation with parameters failed: ${appError.message}`,
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
