export interface IVertexAIRepository {
    generateText(prompt: string): Promise<string>;
    generateWithParameters(
        prompt: string,
        temperature?: number,
        maxTokens?: number
    ): Promise<string>;
}
