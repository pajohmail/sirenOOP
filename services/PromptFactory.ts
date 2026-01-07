import { UseCase } from "@/core/models/DesignDocument";

export class PromptFactory {
    // Phase 1: Analysis
    static createUseCaseExtractionPrompt(chatLog: string): string {
        return `
        Analyze the following conversation about a software system.
        1. Act as an expert software architect. Provide a helpful, concise response.
        2. IMPORTANTE: ADAPT TO THE USER'S LANGUAGE.
        3. CRITICAL: Be PROACTIVE and DRIVE the conversation forward. Instead of open-ended questions, ask LEADING questions (e.g., "Shall we include a dashboard for admins?", "I assume users need a login, correct?").
        4. When you have a solid baseline, explicitly PROPOSE moving to the 'System Design' phase.
        5. Extract any new Use Cases or update existing ones based on the conversation.
        
        Return the result as a JSON object with the following structure:
        {
            "reply": "Your conversational response here...",
            "useCases": [
                { "id": "...", "title": "...", "narrative": "...", "actors": ["..."] }
            ]
        }
        
        Chat Log:
        ${chatLog}
        `;
    }

    static createDomainModelPrompt(useCases: UseCase[]): string {
        return `
        Based on the following Use Cases, create a Domain Model in Mermaid class diagram syntax.
        Focus on the conceptual classes, their attributes, and relationships.
        Do NOT include methods.
        Return ONLY the Mermaid code, wrapped in \`\`\`mermaid blocks.
        
        Use Cases:
        ${JSON.stringify(useCases)}
        `;
    }

    // Phase 2: System Design
    static createArchitecturePrompt(domainModel: string, requirements: string): string {
        return `
        Based on the Domain Model and requirements, propose a System Architecture (e.g., Layered, Microservices).
        Create a Package Diagram in Mermaid syntax that groups the domain classes into logical subsystems/packages.
        Return ONLY the Mermaid code.
        
        Domain Model:
        ${domainModel}
        
        Requirements:
        ${requirements}
        `;
    }

    // Phase 3: Object Design
    static createClassDiagramPrompt(domainModel: string, architecture: string): string {
        return `
        Refine the Domain Model into a Design Class Diagram.
        Apply GRASP and SOLID principles.
        - Add appropriate methods to classes.
        - Add visibility modifiers (+, -, #).
        - Add type information for attributes and return types.
        - Ensure High Cohesion and Low Coupling.
        
        Return the result in Mermaid class diagram syntax.
        
        Domain Model:
        ${domainModel}
        
        Architecture:
        ${architecture}
        `;
    }

    // Phase 4: Validation
    static createValidationPrompt(useCases: UseCase[], classDiagram: string): string {
        return `
        Analyze the following Design Class Diagram against the original Use Cases.
        Perform a Traceability Check:
        1. For each Use Case, identify which classes and methods support it.
        2. Identify any missing functionality (Use Cases not supported by the design).
        3. Identify any unnecessary complexity (Classes/Methods not tracing back to a Use Case).
        
        Return the result as a Markdown report with the following sections:
        - ## Traceability Matrix (Table)
        - ## Missing Requirements
        - ## Unnecessary Components
        - ## Overall Quality Score (1-10)
        
        Use Cases:
        ${JSON.stringify(useCases)}
        
        Class Diagram:
        ${classDiagram}
        `;
    }
}
