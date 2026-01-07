import { DesignDocument } from "@/core/models/DesignDocument";

export interface DesignPattern {
    id: string;
    name: string;
    category: 'Creational' | 'Structural' | 'Behavioral';
    applicability: string;
    consequences: string;
    usageProbability: 'High' | 'Medium' | 'Low';
    reason: string;
}

export class DesignPatternAdvisor {

    private patterns: Omit<DesignPattern, 'usageProbability' | 'reason'>[] = [
        // Behavioral
        {
            id: 'observer',
            name: 'Observer',
            category: 'Behavioral',
            applicability: 'When an abstraction has two aspects, one dependent on the other. When a change to one object requires changing others.',
            consequences: 'Abstract coupling between Subject and Observer. Support for broadcast communication.'
        },
        {
            id: 'strategy',
            name: 'Strategy',
            category: 'Behavioral',
            applicability: 'When many related classes differ only in their behavior. When you need different variants of an algorithm.',
            consequences: 'Families of related algorithms. Alternative to subclassing.'
        },
        {
            id: 'state',
            name: 'State',
            category: 'Behavioral',
            applicability: 'When an object\'s behavior depends on its state and it must change its behavior at run-time depending on that state.',
            consequences: 'Localizes state-specific behavior. Makes state transitions explicit.'
        },
        // Creational
        {
            id: 'factory-method',
            name: 'Factory Method',
            category: 'Creational',
            applicability: 'When a class can\'t anticipate the class of objects it must create.',
            consequences: 'Provides hooks for subclasses. Connects parallel class hierarchies.'
        },
        {
            id: 'singleton',
            name: 'Singleton',
            category: 'Creational',
            applicability: 'When there must be exactly one instance of a class, and it must be accessible to clients from a well-known access point.',
            consequences: 'Controlled access to sole instance. Reduced name space.'
        }
        // Add more patterns as needed (Adapter, Facade, etc.)
    ];

    /**
     * Analyzes Use Cases and Domain Model to suggest Design Patterns.
     * This uses heuristic keyword matching and structural analysis.
     */
    suggestPatterns(document: DesignDocument): DesignPattern[] {
        const suggestions: DesignPattern[] = [];
        const useCases = document.analysis?.useCases || [];
        const combinedText = useCases.map(uc => `${uc.title} ${uc.narrative}`).join(' ').toLowerCase();

        // 1. Observer Heuristic
        if (this.matchesKeywords(combinedText, ['notify', 'alert', 'broadcast', 'subscribe', 'listener', 'when a change occurs'])) {
            suggestions.push(this.createSuggestion('observer', 'High', 'Detected keywords related to event notification or state change propagation.'));
        }

        // 2. Strategy Heuristic
        if (this.matchesKeywords(combinedText, ['algorithm', 'calculation method', 'sorting', 'payment method', 'mode', 'interchangeable'])) {
            suggestions.push(this.createSuggestion('strategy', 'High', 'Detected need for varying algorithms or interchangeable behaviors.'));
        }

        // 3. State Heuristic
        if (this.matchesKeywords(combinedText, ['state', 'transition', 'status', 'lifecycle', 'phase'])) {
            suggestions.push(this.createSuggestion('state', 'Medium', 'Detected keywords suggesting complex state transitions or lifecycle management.'));
        }

        // 4. Factory Method Heuristic
        if (this.matchesKeywords(combinedText, ['create', 'instantiate', 'types of', 'various kinds of'])) {
            suggestions.push(this.createSuggestion('factory-method', 'Medium', 'Detected need for flexible object creation logic.'));
        }

        // 5. Singleton Heuristic
        if (this.matchesKeywords(combinedText, ['global', 'single instance', 'central manager', 'configuration'])) {
            suggestions.push(this.createSuggestion('singleton', 'Low', 'Detected potential single-instance resource (Project Manager, Configuration).'));
        }

        return suggestions;
    }

    private matchesKeywords(text: string, keywords: string[]): boolean {
        return keywords.some(keyword => text.includes(keyword));
    }

    private createSuggestion(id: string, prob: 'High' | 'Medium' | 'Low', reason: string): DesignPattern {
        const pattern = this.patterns.find(p => p.id === id);
        if (!pattern) throw new Error(`Pattern ${id} not found`);
        return {
            ...pattern,
            usageProbability: prob,
            reason
        };
    }
}
