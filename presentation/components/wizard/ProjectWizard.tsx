'use client';

import { useState } from 'react';
import { DesignDocument, ProjectPhase } from '@/core/models/DesignDocument';
import { AnalysisPhase } from '../phases/AnalysisPhase';
import { SystemDesignPhase } from '../phases/SystemDesignPhase';
import { ObjectDesignPhase } from '../phases/ObjectDesignPhase';
import { ValidationPhase } from '../phases/ValidationPhase';

interface ProjectWizardProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
    userToken?: string;
}

const steps: { id: ProjectPhase; label: string }[] = [
    { id: 'analysis', label: '1. Analysis' },
    { id: 'systemDesign', label: '2. System Design' },
    { id: 'objectDesign', label: '3. Object Design' },
    { id: 'validation', label: '4. Validation' },
];

export const ProjectWizard = ({ document, onUpdate, userToken }: ProjectWizardProps) => {
    const currentStepIndex = steps.findIndex((s) => s.id === document.currentPhase);

    const handlePhaseChange = (phase: ProjectPhase) => {
        // In a real app, perform validation before switching
        onUpdate({ ...document, currentPhase: phase });
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            {/* Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${isCompleted
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : isCurrent
                                            ? 'bg-white border-blue-600 text-blue-600'
                                            : 'bg-white border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <span
                                    className={`mt-2 text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'
                                        }`}
                                >
                                    {step.label}
                                </span>
                                {isCompleted && <span className="text-xs text-green-500 mt-1">✓ Done</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Phase Content */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[600px] p-6">
                {document.currentPhase === 'analysis' && (
                    <AnalysisPhase document={document} onUpdate={onUpdate} userToken={userToken} />
                )}
                {document.currentPhase === 'systemDesign' && (
                    <SystemDesignPhase document={document} onUpdate={onUpdate} userToken={userToken} />
                )}
                {document.currentPhase === 'objectDesign' && (
                    <ObjectDesignPhase document={document} onUpdate={onUpdate} userToken={userToken} />
                )}
                {document.currentPhase === 'validation' && (
                    <ValidationPhase document={document} onUpdate={onUpdate} userToken={userToken} />
                )}
            </div>

            {/* Navigation / Debug Controls */}
            <div className="mt-6 flex justify-between">
                <button
                    disabled={currentStepIndex === 0}
                    onClick={() => handlePhaseChange(steps[currentStepIndex - 1].id)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    disabled={currentStepIndex === steps.length - 1}
                    onClick={() => handlePhaseChange(steps[currentStepIndex + 1].id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    Next Phase (Debug)
                </button>
            </div>
        </div>
    );
};
