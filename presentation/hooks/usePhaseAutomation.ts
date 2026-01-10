import { useState } from 'react';
import { DesignDocument } from '@/core/models/DesignDocument';
import { useDesignArchitect } from './useDesignArchitect';

export interface AutomationState {
    isRunning: boolean;
    currentAutoPhase: 'domainModel' | 'systemDesign' | 'objectDesign' | 'validation' | 'report' | null;
    error: Error | null;
    progress?: {
        current: number;
        total: number;
        message: string;
    };
}

export function usePhaseAutomation() {
    const [automationState, setAutomationState] = useState<AutomationState>({
        isRunning: false,
        currentAutoPhase: null,
        error: null
    });

    const {
        generateDomainModel,
        generateSystemArchitecture,
        generateObjectDesign,
        validateDesign,
        generateReport
    } = useDesignArchitect();

    const runAutomatedPhases = async (
        document: DesignDocument,
        onUpdate: (doc: DesignDocument) => void
    ): Promise<DesignDocument> => {
        setAutomationState({
            isRunning: true,
            currentAutoPhase: 'domainModel',
            error: null,
            progress: { current: 1, total: 5, message: 'Generating domain model...' }
        });

        try {
            let updatedDoc = { ...document };

            // Step 1: Domain Model (if not already generated)
            if (!updatedDoc.analysis?.domainModelMermaid) {
                const docWithDomain = await generateDomainModel(updatedDoc);
                updatedDoc = { ...docWithDomain };
                onUpdate(updatedDoc);
            }

            // Step 2: System Design
            setAutomationState({
                isRunning: true,
                currentAutoPhase: 'systemDesign',
                error: null,
                progress: { current: 2, total: 5, message: 'Designing system architecture...' }
            });
            const systemDesignDoc = await generateSystemArchitecture(updatedDoc);
            updatedDoc = {
                ...systemDesignDoc,
                systemDesign: { ...systemDesignDoc.systemDesign!, completed: true }
            };
            onUpdate(updatedDoc);

            // Step 3: Object Design
            setAutomationState({
                isRunning: true,
                currentAutoPhase: 'objectDesign',
                error: null,
                progress: { current: 3, total: 5, message: 'Creating class diagrams...' }
            });
            const objectDesignDoc = await generateObjectDesign(updatedDoc);
            updatedDoc = {
                ...objectDesignDoc,
                objectDesign: { ...objectDesignDoc.objectDesign!, completed: true }
            };
            onUpdate(updatedDoc);

            // Step 4: Validation
            setAutomationState({
                isRunning: true,
                currentAutoPhase: 'validation',
                error: null,
                progress: { current: 4, total: 5, message: 'Validating design...' }
            });
            const validationDoc = await validateDesign(updatedDoc);
            updatedDoc = validationDoc;
            onUpdate(updatedDoc);

            // Step 5: Auto-generate report
            setAutomationState({
                isRunning: true,
                currentAutoPhase: 'report',
                error: null,
                progress: { current: 5, total: 5, message: 'Generating final report...' }
            });
            const report = await generateReport(updatedDoc);

            // Set currentPhase to 'completed' and store the report
            updatedDoc = {
                ...updatedDoc,
                currentPhase: 'completed' as const,
                validation: {
                    ...updatedDoc.validation!,
                    generatedReport: report,
                    reportGeneratedAt: new Date()
                }
            };
            onUpdate(updatedDoc);

            // Complete
            setAutomationState({ isRunning: false, currentAutoPhase: null, error: null });
            return updatedDoc;

        } catch (error) {
            const err = error instanceof Error ? error : new Error('Automation failed');
            setAutomationState({ isRunning: false, currentAutoPhase: null, error: err });
            throw err;
        }
    };

    const resetAutomation = () => {
        setAutomationState({ isRunning: false, currentAutoPhase: null, error: null });
    };

    return {
        automationState,
        runAutomatedPhases,
        resetAutomation
    };
}
