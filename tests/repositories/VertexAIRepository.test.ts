import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VertexAIRepository } from '@/repositories/VertexAIRepository';
import { VertexAI } from '@google-cloud/vertexai';

// Mock @google-cloud/vertexai
vi.mock('@google-cloud/vertexai', () => {
    const generateContentMock = vi.fn().mockResolvedValue({
        response: {
            candidates: [{
                content: {
                    parts: [{ text: 'Generated content' }]
                }
            }]
        }
    });

    const getGenerativeModelMock = vi.fn().mockReturnValue({
        generateContent: generateContentMock
    });

    return {
        VertexAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: getGenerativeModelMock
            };
        }),
        GenerativeModel: vi.fn(),
    };
});

describe('VertexAIRepository', () => {
    let vertexRepo: VertexAIRepository;
    const mockProjectId = 'test-project';
    const mockLocation = 'us-central1';
    const mockUserToken = 'mock-user-token';

    beforeEach(() => {
        vi.clearAllMocks();
        vertexRepo = new VertexAIRepository(
            mockProjectId,
            mockLocation,
            mockUserToken
        );
    });

    it('should generate text from prompt', async () => {
        const prompt = 'Generate 5 questions about a todo app';
        const response = await vertexRepo.generateText(prompt);

        expect(typeof response).toBe('string');
        expect(response).toBe('Generated content');
    });

    it('should use Gemini Pro model by default', async () => {
        const response = await vertexRepo.generateText('test prompt');
        expect(response).toBeDefined();
    });

    it('should support custom parameters', async () => {
        const response = await vertexRepo.generateWithParameters(
            'test prompt',
            0.7,
            1000
        );

        expect(response).toBeDefined();
    });

    it('should use user token for authentication', () => {
        expect(VertexAI).toHaveBeenCalledWith(expect.objectContaining({
            project: mockProjectId,
            location: mockLocation,
            googleAuthOptions: {
                credentials: {
                    access_token: mockUserToken,
                },
            },
        }));
    });
});
