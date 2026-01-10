export type ProjectPhase =
    | 'requirementsSpec'
    | 'analysis'
    | 'completed';

export interface DesignDocument {
    id: string;
    userId: string;
    projectName: string;
    description: string;
    currentPhase: ProjectPhase;

    // Phase 0: Requirements Specification
    requirementsSpec?: RequirementsSpecification;

    // Phase 1: Analysis
    analysis?: {
        useCases: UseCase[];
        domainModelMermaid: string;
        glossary: GlossaryTerm[];
        completed: boolean;
    };

    // Phase 2: System Design
    systemDesign?: {
        architectureDiagramMermaid: string; // e.g., Package diagram
        subsystems: string[];
        deploymentDiagramMermaid?: string;
        completed: boolean;
    };

    // Phase 3: Object Design
    objectDesign?: {
        classDiagramMermaid: string;
        sequenceDiagramsMermaid: string[];
        contracts: OperationContract[];
        completed: boolean;
    };

    // Phase 4: Validation
    validation?: {
        reviews: ReviewComment[];
        isApproved: boolean;
        exportUrl?: string;
        generatedReport?: string;
        reportGeneratedAt?: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface UseCase {
    id: string;
    title: string;
    narrative: string; // Textual description
    actors: string[];
}

export interface GlossaryTerm {
    term: string;
    definition: string;
}

export interface OperationContract {
    operation: string;
    preConditions: string[];
    postConditions: string[];
}

export interface ReviewComment {
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    resolved: boolean;
}

export interface Question {
    id: number;
    text: string;
    options: string[];
    allowMultiple: boolean;
}

export interface Answer {
    questionId: number;
    selectedOptions: string[];
}

export interface RequirementsSpecification {
    projectPurpose: string;
    stakeholders: Stakeholder[];
    constraints: Constraint[];
    functionalRequirements: FunctionalRequirement[];
    qualityRequirements: QualityRequirement[];
    completed: boolean;
}

export interface Stakeholder {
    id: string;
    name: string;
    role: string;
    interests: string[];
}

export interface Constraint {
    id: string;
    type: 'technical' | 'business' | 'regulatory' | 'schedule';
    description: string;
}

export interface FunctionalRequirement {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface QualityRequirement {
    id: string;
    category: 'performance' | 'security' | 'usability' | 'maintainability' | 'reliability';
    description: string;
    metric?: string;
}
