import { DesignDocument, UseCase } from "@/core/models/DesignDocument";
import { IVertexAIRepository } from "@/repositories/interfaces/IVertexAIRepository";
import { PromptFactory } from "./PromptFactory";
import { ValidationError, AIGenerationError } from "@/core/errors/ApplicationErrors";
import { handleError } from "@/core/utils/errorHandler";
import { ChatAnalysisResponseSchema, MermaidCodeSchema } from "@/core/schemas/AIResponseSchemas";
import { z } from 'zod';

export interface IDesignArchitectService {
    startAnalysis(projectId: string, initialDescription: string): Promise<DesignDocument>;
    analyzeChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }>;
    generateDomainModel(document: DesignDocument): Promise<DesignDocument>;
    startSystemDesign(document: DesignDocument): Promise<DesignDocument>;
    generateSystemArchitecture(document: DesignDocument): Promise<DesignDocument>;
    generateObjectDesign(document: DesignDocument): Promise<DesignDocument>;
    validateDesign(document: DesignDocument): Promise<DesignDocument>;
    generateFinalReport(document: DesignDocument): Promise<string>;
}

export class DesignArchitectService implements IDesignArchitectService {
    constructor(private vertexRepo: IVertexAIRepository) { }

    async startAnalysis(projectId: string, initialDescription: string): Promise<DesignDocument> {
        // Create initial document structure
        const doc: DesignDocument = {
            id: crypto.randomUUID(), // Or generate from DB
            userId: 'current-user-id', // Should be injected or passed
            projectName: projectId,
            description: initialDescription,
            currentPhase: 'analysis',
            analysis: {
                useCases: [],
                domainModelMermaid: '',
                glossary: [],
                completed: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return doc;
    }

    async analyzeChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }> {
        if (!document.analysis) {
            throw new ValidationError("Analysis phase not initialized", {
                documentId: document.id,
                currentPhase: document.currentPhase
            });
        }

        const prompt = PromptFactory.createUseCaseExtractionPrompt(chatLog);
        const result = await this.vertexRepo.generateText(prompt);

        let reply = "I've updated the analysis.";

        // Parse JSON result with Zod validation
        try {
            // Clean up code blocks if present
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Validate with Zod schema
            const validated = ChatAnalysisResponseSchema.parse(parsed);

            document.analysis.useCases = validated.useCases;
            reply = validated.reply;
            document.updatedAt = new Date();
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("AI response validation failed", error.errors);
                throw new ValidationError('Invalid AI response format', {
                    zodErrors: error.errors,
                    originalResponse: result.substring(0, 500),
                });
            }

            const appError = handleError(error);
            console.error("Failed to parse AI response", appError);

            // Return graceful fallback for non-validation errors
            reply = "I had trouble processing the design updates, but I'm still listening.";
        }

        return { document, reply };
    }

    async generateDomainModel(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || document.analysis.useCases.length === 0) {
            throw new ValidationError("No Use Cases available for Domain Model generation", {
                documentId: document.id,
                useCaseCount: document.analysis?.useCases.length || 0
            });
        }

        const prompt = PromptFactory.createDomainModelPrompt(document.analysis.useCases);
        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result.trim();

        // Validate Mermaid code with Zod
        try {
            const validated = MermaidCodeSchema.parse(mermaidCode);
            document.analysis.domainModelMermaid = validated;
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Invalid Mermaid diagram generated', {
                    zodErrors: error.errors,
                    generatedCode: mermaidCode.substring(0, 200),
                });
            }
            throw error;
        }

        document.updatedAt = new Date();
        return document;
    }

    async startSystemDesign(document: DesignDocument): Promise<DesignDocument> {
        document.currentPhase = 'systemDesign';
        document.systemDesign = {
            architectureDiagramMermaid: '',
            subsystems: [],
            completed: false
        };
        return document;
    }

    async generateSystemArchitecture(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || !document.analysis.domainModelMermaid) {
            throw new Error("Domain Model is required for System Design");
        }

        const prompt = PromptFactory.createArchitecturePrompt(
            document.analysis.domainModelMermaid,
            document.description || "No specific non-functional requirements provided." // Fallback
        );

        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result;

        if (!document.systemDesign) {
            await this.startSystemDesign(document);
        }

        // We know systemDesign exists because of startSystemDesign above, but TS might complain
        if (document.systemDesign) {
            document.systemDesign.architectureDiagramMermaid = mermaidCode;
            document.updatedAt = new Date();
        }

        return document;
    }

    async generateObjectDesign(document: DesignDocument): Promise<DesignDocument> {
        if (!document.systemDesign || !document.systemDesign.architectureDiagramMermaid) {
            throw new Error("System Architecture is required for Object Design");
        }

        const prompt = PromptFactory.createClassDiagramPrompt(
            document.analysis?.domainModelMermaid || '',
            document.systemDesign.architectureDiagramMermaid
        );

        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result;

        if (!document.objectDesign) {
            document.objectDesign = {
                classDiagramMermaid: '',
                sequenceDiagramsMermaid: [],
                contracts: [],
                completed: false
            };
        }

        document.objectDesign.classDiagramMermaid = mermaidCode;
        document.updatedAt = new Date();

        return document;
    }

    async validateDesign(document: DesignDocument): Promise<DesignDocument> {
        if (!document.objectDesign?.classDiagramMermaid) {
            throw new Error("Object Design is required for Validation");
        }
        if (!document.analysis?.useCases) {
            throw new Error("Use Cases are required for Validation");
        }

        const prompt = PromptFactory.createValidationPrompt(
            document.analysis.useCases,
            document.objectDesign.classDiagramMermaid
        );

        const result = await this.vertexRepo.generateText(prompt);

        if (!document.validation) {
            document.validation = {
                reviews: [],
                isApproved: false
            };
        }

        // Add the AI report as a review comment for now, or just store it.
        // For this MVP, let's append it to reviews or store in detailed field if we had one.
        // We'll create a system review comment.
        document.validation.reviews.push({
            id: crypto.randomUUID(),
            author: 'AI Validator',
            content: result,
            timestamp: new Date(),
            resolved: false
        });

        document.updatedAt = new Date();
        return document;
    }

    private getMermaidImageUrl(mermaidCode: string): string {
        const encoded = Buffer.from(mermaidCode).toString('base64');
        return `https://mermaid.ink/img/${encoded}`;
    }

    async generateFinalReport(document: DesignDocument): Promise<string> {
        // Deterministic generation of Markdown report
        let report = `# Design Document: ${document.projectName}\n\n`;
        report += `**Description:** ${document.description}\n\n`;

        report += `## Phase 1: Analysis\n\n`;
        report += `### Use Cases\n`;
        document.analysis?.useCases.forEach(uc => {
            report += `- **${uc.title}**: ${uc.narrative}\n`;
        });

        if (document.analysis?.domainModelMermaid) {
            report += `\n### Domain Model\n\n`;
            report += `**Diagram:**\n![Domain Model](${this.getMermaidImageUrl(document.analysis.domainModelMermaid)})\n\n`;
            report += `**Mermaid Code:**\n\`\`\`mermaid\n${document.analysis.domainModelMermaid}\n\`\`\`\n\n`;
        }

        report += `## Phase 2: System Design\n\n`;
        if (document.systemDesign?.architectureDiagramMermaid) {
            report += `### Architecture\n\n`;
            report += `**Diagram:**\n![Architecture](${this.getMermaidImageUrl(document.systemDesign.architectureDiagramMermaid)})\n\n`;
            report += `**Mermaid Code:**\n\`\`\`mermaid\n${document.systemDesign.architectureDiagramMermaid}\n\`\`\`\n\n`;
        }

        report += `## Phase 3: Object Design\n\n`;
        if (document.objectDesign?.classDiagramMermaid) {
            report += `### Class Diagram\n\n`;
            report += `**Diagram:**\n![Class Diagram](${this.getMermaidImageUrl(document.objectDesign.classDiagramMermaid)})\n\n`;
            report += `**Mermaid Code:**\n\`\`\`mermaid\n${document.objectDesign.classDiagramMermaid}\n\`\`\`\n\n`;
        }

        report += `## Phase 4: Validation\n\n`;
        const aiReview = document.validation?.reviews.find(r => r.author === 'AI Validator');
        if (aiReview) {
            report += `### AI Traceability Report\n${aiReview.content}\n\n`;
        }

        return report;
    }
}
