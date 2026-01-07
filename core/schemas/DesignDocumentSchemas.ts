import { z } from 'zod';

/**
 * Use Case Schema
 */
export const UseCaseSchema = z.object({
    id: z.string().min(1, 'Use case ID is required'),
    title: z.string().min(1, 'Title is required'),
    narrative: z.string().min(10, 'Narrative must be at least 10 characters'),
    actors: z.array(z.string()).min(1, 'At least one actor is required'),
});

export type ValidatedUseCase = z.infer<typeof UseCaseSchema>;

/**
 * Glossary Term Schema
 */
export const GlossaryTermSchema = z.object({
    term: z.string().min(1, 'Term is required'),
    definition: z.string().min(1, 'Definition is required'),
});

export type ValidatedGlossaryTerm = z.infer<typeof GlossaryTermSchema>;

/**
 * Analysis Phase Schema
 */
export const AnalysisPhaseSchema = z.object({
    useCases: z.array(UseCaseSchema),
    domainModelMermaid: z.string(),
    glossary: z.array(GlossaryTermSchema),
    completed: z.boolean(),
});

export type ValidatedAnalysisPhase = z.infer<typeof AnalysisPhaseSchema>;

/**
 * System Design Phase Schema
 */
export const SystemDesignPhaseSchema = z.object({
    architectureDiagramMermaid: z.string().min(1, 'Architecture diagram is required'),
    subsystems: z.array(z.string()),
    deploymentDiagramMermaid: z.string().optional(),
    completed: z.boolean(),
});

export type ValidatedSystemDesignPhase = z.infer<typeof SystemDesignPhaseSchema>;

/**
 * Operation Contract Schema
 */
export const OperationContractSchema = z.object({
    operation: z.string().min(1, 'Operation name is required'),
    preConditions: z.array(z.string()),
    postConditions: z.array(z.string()),
});

export type ValidatedOperationContract = z.infer<typeof OperationContractSchema>;

/**
 * Object Design Phase Schema
 */
export const ObjectDesignPhaseSchema = z.object({
    classDiagramMermaid: z.string().min(1, 'Class diagram is required'),
    sequenceDiagramsMermaid: z.array(z.string()),
    contracts: z.array(OperationContractSchema),
    completed: z.boolean(),
});

export type ValidatedObjectDesignPhase = z.infer<typeof ObjectDesignPhaseSchema>;

/**
 * Review Comment Schema
 */
export const ReviewCommentSchema = z.object({
    id: z.string().min(1),
    author: z.string().min(1),
    content: z.string().min(1),
    timestamp: z.date(),
    resolved: z.boolean(),
});

export type ValidatedReviewComment = z.infer<typeof ReviewCommentSchema>;

/**
 * Validation Phase Schema
 */
export const ValidationPhaseSchema = z.object({
    reviews: z.array(ReviewCommentSchema),
    isApproved: z.boolean(),
    exportUrl: z.string().url().optional(),
});

export type ValidatedValidationPhase = z.infer<typeof ValidationPhaseSchema>;

/**
 * Complete Design Document Schema
 */
export const DesignDocumentSchema = z.object({
    id: z.string().uuid('Invalid document ID format'),
    userId: z.string().min(1, 'User ID is required'),
    projectName: z.string().min(1, 'Project name is required'),
    description: z.string(),
    currentPhase: z.enum(['analysis', 'systemDesign', 'objectDesign', 'validation']),
    analysis: AnalysisPhaseSchema.optional(),
    systemDesign: SystemDesignPhaseSchema.optional(),
    objectDesign: ObjectDesignPhaseSchema.optional(),
    validation: ValidationPhaseSchema.optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ValidatedDesignDocument = z.infer<typeof DesignDocumentSchema>;

/**
 * Partial schema for updates (all fields optional except id)
 */
export const DesignDocumentUpdateSchema = DesignDocumentSchema.partial().required({ id: true });

export type ValidatedDesignDocumentUpdate = z.infer<typeof DesignDocumentUpdateSchema>;
