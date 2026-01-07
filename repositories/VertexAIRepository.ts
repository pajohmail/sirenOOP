import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { IVertexAIRepository } from './interfaces/IVertexAIRepository';

export class VertexAIRepository implements IVertexAIRepository {
    private vertexAI: VertexAI;
    private model: GenerativeModel;

    constructor(projectId: string, location: string) {
        // Initialize Vertex AI with Application Default Credentials (ADC)
        // This relies on the environment having credentials (gcloud auth login locally, or Service Account in cloud)
        this.vertexAI = new VertexAI({
            project: projectId,
            location: location,
        });

        this.model = this.vertexAI.getGenerativeModel({
            model: 'gemini-2.0-flash-001',
        });
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.candidates?.[0].content.parts[0].text;

            if (!text) {
                throw new Error('No content generated');
            }

            return text;
        } catch (error: any) {
            throw new Error(`Vertex AI generation failed: ${error.message}`);
        }
    }

    async generateWithParameters(
        prompt: string,
        temperature?: number,
        maxOutputTokens?: number
    ): Promise<string> {
        try {
            const model = this.vertexAI.getGenerativeModel({
                model: 'gemini-2.0-flash-001',
                generationConfig: {
                    temperature,
                    maxOutputTokens,
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.candidates?.[0].content.parts[0].text;

            if (!text) {
                throw new Error('No content generated');
            }

            return text;
        } catch (error: any) {
            throw new Error(`Vertex AI generation with parameters failed: ${error.message}`);
        }
    }
}
