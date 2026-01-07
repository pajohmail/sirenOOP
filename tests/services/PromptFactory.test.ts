import { describe, it, expect } from 'vitest';
import { PromptFactory } from '@/services/PromptFactory';
import { UseCase } from '@/core/models/DesignDocument';

describe('PromptFactory', () => {
    describe('createUseCaseExtractionPrompt', () => {
        it('should create valid prompt with chat log', () => {
            const chatLog = 'User wants a todo application';
            const prompt = PromptFactory.createUseCaseExtractionPrompt(chatLog);

            expect(prompt).toContain('User wants a todo application');
            expect(prompt).toContain('JSON');
            expect(prompt).toContain('useCases');
            expect(prompt).toContain('reply');
        });

        it('should include instructions for structured output', () => {
            const prompt = PromptFactory.createUseCaseExtractionPrompt('test');

            expect(prompt).toContain('Analyze');
            expect(prompt).toContain('JSON object');
        });

        it('should request language adaptation', () => {
            const prompt = PromptFactory.createUseCaseExtractionPrompt('test');

            expect(prompt).toContain('ADAPT TO THE USER\'S LANGUAGE');
        });

        it('should include proactive guidance', () => {
            const prompt = PromptFactory.createUseCaseExtractionPrompt('test');

            expect(prompt).toContain('PROACTIVE');
            expect(prompt).toContain('LEADING questions');
        });
    });

    describe('createDomainModelPrompt', () => {
        it('should create prompt with use cases', () => {
            const useCases: UseCase[] = [{
                id: 'uc-1',
                title: 'Create Todo',
                narrative: 'User creates a new todo item',
                actors: ['User']
            }];

            const prompt = PromptFactory.createDomainModelPrompt(useCases);

            expect(prompt).toContain('Domain Model');
            expect(prompt).toContain('Mermaid');
            expect(prompt).toContain('Create Todo');
            expect(prompt).toContain('User creates a new todo item');
        });

        it('should include Mermaid guidelines', () => {
            const useCases: UseCase[] = [{
                id: 'uc-1',
                title: 'Test',
                narrative: 'Test narrative',
                actors: ['User']
            }];

            const prompt = PromptFactory.createDomainModelPrompt(useCases);

            expect(prompt).toContain('Mermaid');
            expect(prompt).toContain('attributes');
            expect(prompt).toContain('relationships');
        });

        it('should handle multiple use cases', () => {
            const useCases: UseCase[] = [
                {
                    id: 'uc-1',
                    title: 'Create Todo',
                    narrative: 'User creates todo',
                    actors: ['User']
                },
                {
                    id: 'uc-2',
                    title: 'Delete Todo',
                    narrative: 'User deletes todo',
                    actors: ['User']
                }
            ];

            const prompt = PromptFactory.createDomainModelPrompt(useCases);

            expect(prompt).toContain('Create Todo');
            expect(prompt).toContain('Delete Todo');
        });

        it('should include JSON stringified use cases', () => {
            const useCases: UseCase[] = [{
                id: 'uc-1',
                title: 'Test UC',
                narrative: 'Test narrative',
                actors: ['User', 'Admin']
            }];

            const prompt = PromptFactory.createDomainModelPrompt(useCases);

            expect(prompt).toContain(JSON.stringify(useCases));
        });
    });

    describe('createArchitecturePrompt', () => {
        it('should create prompt for system architecture', () => {
            const domainModel = 'classDiagram\n    class User';
            const requirements = 'User login system';

            const prompt = PromptFactory.createArchitecturePrompt(domainModel, requirements);

            expect(prompt).toContain('System Architecture');
            expect(prompt).toContain('classDiagram');
            expect(prompt).toContain('User login system');
        });

        it('should include architectural guidelines', () => {
            const prompt = PromptFactory.createArchitecturePrompt('', 'test requirements');

            expect(prompt).toContain('Layered');
            expect(prompt).toContain('Microservices');
            expect(prompt).toContain('subsystems');
        });

        it('should request Mermaid output format', () => {
            const prompt = PromptFactory.createArchitecturePrompt('', '');

            expect(prompt).toContain('Mermaid');
        });
    });

    describe('createClassDiagramPrompt', () => {
        it('should create prompt for class diagram', () => {
            const domainModel = 'classDiagram\n    class User\n    class Order';
            const architecture = 'flowchart TD\n    A[Frontend] --> B[Backend]';

            const prompt = PromptFactory.createClassDiagramPrompt(domainModel, architecture);

            expect(prompt).toContain('Design Class Diagram');
            expect(prompt).toContain('classDiagram');
            expect(prompt).toContain('flowchart');
        });

        it('should include GRASP and SOLID principles', () => {
            const prompt = PromptFactory.createClassDiagramPrompt('', '');

            expect(prompt).toContain('GRASP');
            expect(prompt).toContain('SOLID');
        });

        it('should request detailed class information', () => {
            const prompt = PromptFactory.createClassDiagramPrompt('', '');

            expect(prompt).toContain('methods');
            expect(prompt).toContain('visibility');
            expect(prompt).toContain('Cohesion');
            expect(prompt).toContain('Coupling');
        });
    });

    describe('createValidationPrompt', () => {
        it('should create comprehensive validation prompt', () => {
            const useCases: UseCase[] = [{
                id: 'uc-1',
                title: 'Create Todo',
                narrative: 'User creates todo',
                actors: ['User']
            }];

            const classDiagram = 'classDiagram\n    class TodoController';

            const prompt = PromptFactory.createValidationPrompt(useCases, classDiagram);

            expect(prompt).toContain('Traceability');
            expect(prompt).toContain('Create Todo');
            expect(prompt).toContain('classDiagram');
        });

        it('should request structured validation output', () => {
            const useCases: UseCase[] = [{
                id: 'uc-1',
                title: 'Test',
                narrative: 'Test',
                actors: ['User']
            }];

            const prompt = PromptFactory.createValidationPrompt(useCases, '');

            expect(prompt).toContain('Markdown report');
            expect(prompt).toContain('Traceability Matrix');
            expect(prompt).toContain('Quality Score');
        });
    });
});
