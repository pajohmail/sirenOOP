'use client';


import { DesignDocument, ProjectPhase } from '@/core/models/DesignDocument';
import { RequirementsSpecPhase } from '../phases/RequirementsSpecPhase';
import { AnalysisPhase } from '../phases/AnalysisPhase';
import { CompletedPhase } from '../phases/CompletedPhase';
import { ModelTierBadge } from '../shared/ModelTierBadge';
import { usePhaseAutomation } from '@/presentation/hooks/usePhaseAutomation';
import { useEffect } from 'react';

interface ProjectWizardProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

const steps: { id: ProjectPhase; label: string }[] = [
    { id: 'requirementsSpec', label: '1. Requirements' },
    { id: 'analysis', label: '2. Analysis' },
    { id: 'completed', label: '3. Completed' },
];

export const ProjectWizard = ({ document, onUpdate }: ProjectWizardProps) => {
    const currentStepIndex = steps.findIndex((s) => s.id === document.currentPhase);
    const { automationState } = usePhaseAutomation();

    // Migration: Auto-migrate old phases to 'completed'
    useEffect(() => {
        const oldPhases = ['systemDesign', 'objectDesign', 'validation'];
        if (oldPhases.includes(document.currentPhase)) {
            onUpdate({ ...document, currentPhase: 'completed' as const });
        }
    }, [document.currentPhase]);

    const handlePhaseChange = (phase: ProjectPhase) => {
        // In a real app, perform validation before switching
        onUpdate({ ...document, currentPhase: phase });
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            {/* Model Tier Badge */}
            <div className="mb-4 flex justify-end">
                <ModelTierBadge />
            </div>

            {/* Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        // Show automation spinner on Analysis step when automation is running
                        const isAutoRunning = automationState.isRunning && step.id === 'analysis';

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${isCompleted
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : isCurrent || isAutoRunning
                                            ? 'bg-white border-blue-600 text-blue-600'
                                            : 'bg-white border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {isAutoRunning ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-sm font-medium ${isCurrent || isAutoRunning ? 'text-blue-600' : 'text-gray-500'
                                        }`}
                                >
                                    {step.label}
                                </span>
                                {isCompleted && <span className="text-xs text-green-500 mt-1">✓ Done</span>}
                                {isAutoRunning && <span className="text-xs text-blue-500 mt-1 animate-pulse">Running...</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Phase Content */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[600px]">
                {document.currentPhase === 'requirementsSpec' && (
                    <div className="p-6">
                        <RequirementsSpecPhase document={document} onUpdate={onUpdate} />
                    </div>
                )}
                {document.currentPhase === 'analysis' && (
                    <div className="p-6">
                        <AnalysisPhase document={document} onUpdate={onUpdate} />
                    </div>
                )}
                {document.currentPhase === 'completed' && (
                    <CompletedPhase document={document} onUpdate={onUpdate} />
                )}
            </div>

            {/* Navigation / Debug Controls */}
            <div className="mt-6 flex justify-between">
                <button
                    disabled={currentStepIndex === 0 || automationState.isRunning}
                    onClick={() => handlePhaseChange(steps[currentStepIndex - 1].id)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    disabled={currentStepIndex === steps.length - 1 || automationState.isRunning}
                    onClick={() => handlePhaseChange(steps[currentStepIndex + 1].id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next Phase (Debug)
                </button>
            </div>

            {/* Automation Status */}
            {automationState.isRunning && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">Generating Design</p>
                            {automationState.progress && (
                                <>
                                    <p className="text-xs text-blue-700 mt-1">{automationState.progress.message}</p>
                                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(automationState.progress.current / automationState.progress.total) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Step {automationState.progress.current} of {automationState.progress.total}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {automationState.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-900">Automation Error</p>
                    <p className="text-xs text-red-700 mt-1">{automationState.error.message}</p>
                </div>
            )}
        </div>
    );
};
