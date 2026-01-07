import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesignArchitectService } from '@/services/DesignArchitectService';
import { IVertexAIRepository } from '@/repositories/interfaces/IVertexAIRepository';
import { DesignDocument } from '@/core/models/DesignDocument';
import { ValidationError } from '@/core/errors/ApplicationErrors';

describe('DesignArchitectService', () => {
    let service: DesignArchitectService;
    let mockVertexRepo: IVertexAIRepository;

    beforeEach(() => {
        // Create mock repository
        mockVertexRepo = {
            generateText: vi.fn(),
            generateWithParameters: vi.fn()
        };
        service = new DesignArchitectService(mockVertexRepo);
    });

    describe('startAnalysis', () => {
        it('should create initial document structure', async () => {
            const doc = await service.startAnalysis('test-project', 'Test description');

            expect(doc.projectName).toBe('test-project');
            expect(doc.description).toBe('Test description');
            expect(doc.currentPhase).toBe('analysis');
            expect(doc.analysis).toBeDefined();
            expect(doc.analysis?.useCases).toEqual([]);
            expect(doc.analysis?.domainModelMermaid).toBe('');
            expect(doc.analysis?.glossary).toEqual([]);
            expect(doc.analysis?.completed).toBe(false);
            expect(doc.id).toBeDefined();
            expect(doc.createdAt).toBeInstanceOf(Date);
            expect(doc.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('analyzeChat', () => {
        it('should parse AI response and update use cases', async () => {
            const mockResponse = JSON.stringify({
                reply: 'I understand you need a todo app.',
                useCases: [{
                    id: 'uc-1',
                    title: 'Create Todo',
                    narrative: 'User creates a new todo item with title and description',
                    actors: ['User']
                }]
            });

            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockResponse);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: { useCases: [], domainModelMermaid: '', glossary: [], completed: false },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.analyzeChat(doc, 'I need a todo app');

            expect(result.document.analysis?.useCases).toHaveLength(1);
            expect(result.document.analysis?.useCases[0].title).toBe('Create Todo');
            expect(result.reply).toBe('I understand you need a todo app.');
            expect(mockVertexRepo.generateText).toHaveBeenCalledWith(
                expect.stringContaining('I need a todo app')
            );
        });

        it('should handle AI response with markdown code blocks', async () => {
            const mockResponse = '```json\n' + JSON.stringify({
                reply: 'Got it',
                useCases: [{
                    id: 'uc-1',
                    title: 'Test UC',
                    narrative: 'Test narrative here',
                    actors: ['User']
                }]
            }) + '\n```';

            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockResponse);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: { useCases: [], domainModelMermaid: '', glossary: [], completed: false },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.analyzeChat(doc, 'test message');

            expect(result.document.analysis?.useCases).toHaveLength(1);
            expect(result.reply).toBe('Got it');
        });

        it('should throw ValidationError if analysis phase not initialized', async () => {
            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'systemDesign',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await expect(service.analyzeChat(doc, 'test')).rejects.toThrow(ValidationError);
        });

        it('should handle malformed AI responses gracefully', async () => {
            vi.mocked(mockVertexRepo.generateText).mockResolvedValue('invalid json');

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: { useCases: [], domainModelMermaid: '', glossary: [], completed: false },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.analyzeChat(doc, 'message');

            // Should return graceful fallback
            expect(result.reply).toContain('trouble processing');
        });
    });

    describe('generateDomainModel', () => {
        it('should generate domain model from use cases', async () => {
            const mockMermaidCode = `classDiagram
    class User {
        +string userId
        +string email
    }
    class TodoItem {
        +string itemId
        +string title
    }
    User "1" --> "*" TodoItem`;

            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockMermaidCode);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: {
                    useCases: [{
                        id: 'uc-1',
                        title: 'Create Todo',
                        narrative: 'User creates todo',
                        actors: ['User']
                    }],
                    domainModelMermaid: '',
                    glossary: [],
                    completed: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.generateDomainModel(doc);

            expect(result.analysis?.domainModelMermaid).toContain('classDiagram');
            expect(result.analysis?.domainModelMermaid).toContain('User');
            expect(result.analysis?.domainModelMermaid).toContain('TodoItem');
            expect(mockVertexRepo.generateText).toHaveBeenCalled();
        });

        it('should extract Mermaid code from markdown blocks', async () => {
            const mockResponse = '```mermaid\nclassDiagram\n    class Test\n```';
            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockResponse);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: {
                    useCases: [{
                        id: 'uc-1',
                        title: 'Test',
                        narrative: 'Test narrative',
                        actors: ['User']
                    }],
                    domainModelMermaid: '',
                    glossary: [],
                    completed: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.generateDomainModel(doc);

            expect(result.analysis?.domainModelMermaid).toBe('classDiagram\n    class Test');
        });

        it('should throw ValidationError if no use cases available', async () => {
            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: { useCases: [], domainModelMermaid: '', glossary: [], completed: false },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await expect(service.generateDomainModel(doc)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid Mermaid code', async () => {
            vi.mocked(mockVertexRepo.generateText).mockResolvedValue('This is not mermaid code');

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: {
                    useCases: [{
                        id: 'uc-1',
                        title: 'Test',
                        narrative: 'Test narrative',
                        actors: ['User']
                    }],
                    domainModelMermaid: '',
                    glossary: [],
                    completed: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await expect(service.generateDomainModel(doc)).rejects.toThrow(ValidationError);
        });
    });

    describe('startSystemDesign', () => {
        it('should initialize system design phase', async () => {
            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'analysis',
                analysis: {
                    useCases: [],
                    domainModelMermaid: '',
                    glossary: [],
                    completed: true
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.startSystemDesign(doc);

            expect(result.currentPhase).toBe('systemDesign');
            expect(result.systemDesign).toBeDefined();
            expect(result.systemDesign?.architectureDiagramMermaid).toBe('');
            expect(result.systemDesign?.subsystems).toEqual([]);
            expect(result.systemDesign?.completed).toBe(false);
        });
    });

    describe('generateSystemArchitecture', () => {
        it('should generate architecture diagram from domain model', async () => {
            const mockArchitecture = 'graph TD\n    Package1 --> Package2';
            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockArchitecture);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'systemDesign',
                analysis: {
                    useCases: [],
                    domainModelMermaid: 'classDiagram...',
                    glossary: [],
                    completed: true
                },
                systemDesign: {
                    architectureDiagramMermaid: '',
                    subsystems: [],
                    completed: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.generateSystemArchitecture(doc);

            expect(result.systemDesign?.architectureDiagramMermaid).toContain('graph TD');
            expect(result.systemDesign?.architectureDiagramMermaid).toContain('Package1');
            expect(mockVertexRepo.generateText).toHaveBeenCalled();
        });
    });

    describe('generateObjectDesign', () => {
        it('should generate detailed class diagram', async () => {
            const mockClassDiagram = 'classDiagram\n    class DetailedClass {\n        +method()\n    }';
            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockClassDiagram);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'objectDesign',
                analysis: {
                    useCases: [],
                    domainModelMermaid: 'original domain model',
                    glossary: [],
                    completed: true
                },
                systemDesign: {
                    architectureDiagramMermaid: 'architecture',
                    subsystems: [],
                    completed: true
                },
                objectDesign: {
                    classDiagramMermaid: '', // Removed classes/relationships
                    sequenceDiagramsMermaid: [],
                    contracts: [],
                    completed: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.generateObjectDesign(doc);

            expect(result.objectDesign?.classDiagramMermaid).toContain('DetailedClass');
            expect(result.objectDesign?.classDiagramMermaid).toContain('+method()');
        });
    });

    describe('validateDesign', () => {
        it('should perform traceability check and return report', async () => {
            const mockValidation = `## Traceability Matrix\n| Use Case | Class |\n| --- | --- |\n| UC1 | ClassA |\n\n## Missing Requirements\nNone`;
            vi.mocked(mockVertexRepo.generateText).mockResolvedValue(mockValidation);

            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user-1',
                projectName: 'Test',
                description: 'Test',
                currentPhase: 'validation',
                analysis: {
                    useCases: [{ id: 'uc-1', title: 'UC1', narrative: '...', actors: [] }],
                    domainModelMermaid: '',
                    glossary: [],
                    completed: true
                },
                objectDesign: {
                    classDiagramMermaid: 'classDiagram...',
                    sequenceDiagramsMermaid: [], // Removed classes/relationships
                    contracts: [],
                    completed: true
                },
                validation: {
                    reviews: [],
                    isApproved: false, // Added required field
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await service.validateDesign(doc);

            expect(result.validation?.reviews).toHaveLength(1);
            expect(result.validation?.reviews[0].author).toBe('AI Validator');
            expect(result.validation?.reviews[0].content).toContain('Traceability Matrix');
        });
    });

    describe('generateFinalReport', () => {
        it('should compile markdown report with mermaid images', async () => {
            const doc: DesignDocument = {
                id: 'doc-1',
                userId: 'user',
                projectName: 'Report Test',
                description: 'Description',
                currentPhase: 'validation',
                analysis: {
                    useCases: [{ id: '1', title: 'UC1', narrative: 'Narrative 1', actors: [] }],
                    domainModelMermaid: 'classDiagram\nclass A',
                    glossary: [],
                    completed: true
                },
                systemDesign: {
                    architectureDiagramMermaid: 'graph TD\nA-->B',
                    subsystems: [],
                    completed: true
                },
                objectDesign: {
                    classDiagramMermaid: 'classDiagram\nclass Detailed',
                    sequenceDiagramsMermaid: [], // Removed invalid props
                    contracts: [],
                    completed: true
                },
                validation: {
                    reviews: [{ id: '1', author: 'AI Validator', timestamp: new Date(), content: 'Looks good', resolved: false }], // Fixed date -> timestamp, added resolved
                    isApproved: true
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const report = await service.generateFinalReport(doc);

            expect(report).toContain('# Design Document: Report Test');
            expect(report).toContain('Narrative 1');
            // Check for mermaid code blocks
            expect(report).toContain('```mermaid\nclassDiagram\nclass A');
            // Check for mermaid rendered images (base64 check is tricky, just check url prefix)
            expect(report).toContain('![Domain Model](https://mermaid.ink/img/');
            expect(report).toContain('![Architecture](https://mermaid.ink/img/');
            expect(report).toContain('![Class Diagram](https://mermaid.ink/img/');
            expect(report).toContain('Looks good');
        });
    });
});
