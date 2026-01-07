'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { DesignPatternAdvisor } from '@/services/DesignPatternAdvisor';
import { useState, useMemo } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';
import { MermaidRenderer } from '../shared/MermaidRenderer';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const ObjectDesignPhase = ({ document, onUpdate }: PhaseProps) => {
    const [error, setError] = useState<string | null>(null);
    const { generateObjectDesign, isLoading: isGenerating } = useDesignArchitect();

    const [advisor] = useState(() => new DesignPatternAdvisor());

    const suggestions = useMemo(() => {
        return advisor.suggestPatterns(document);
    }, [document.analysis?.useCases]);

    const handleGenerate = async () => {
        setError(null);
        try {
            const updatedDoc = await generateObjectDesign(document);
            onUpdate(updatedDoc);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full p-4">
            {/* Main Content Area */}
            <div className="md:col-span-2 flex flex-col h-full border rounded-lg bg-white overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-700">Object Design (Class Diagram)</h3>
                        <p className="text-xs text-gray-500">Phase 3</p>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Class Diagram'}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-gray-50/50">
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded w-full max-w-2xl">
                            {error}
                        </div>
                    )}

                    {document.objectDesign?.classDiagramMermaid ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 bg-white border p-4 rounded shadow-sm overflow-auto">
                                <MermaidRenderer
                                    chart={document.objectDesign.classDiagramMermaid}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <p>No class diagram generated yet.</p>
                            <p className="text-sm mt-2">Click generate to create a detailed design based on the system architecture.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pattern Suggestions Sidebar */}
            <div className="border rounded-lg p-4 bg-gray-50 overflow-y-auto h-[600px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Pattern AI Advisor
                </h3>

                {suggestions.length > 0 ? (
                    <div className="space-y-4">
                        {suggestions.map(pattern => (
                            <div key={pattern.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800">{pattern.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${pattern.usageProbability === 'High' ? 'bg-green-100 text-green-800' :
                                        pattern.usageProbability === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {pattern.usageProbability}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 italic">{pattern.reason}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    <span className="font-medium">Why?</span> {pattern.applicability}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No specific patterns detected yet based on current Use Cases.</p>
                )}
            </div>
        </div>
    );
};
