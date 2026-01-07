'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';
import { MermaidRenderer } from '../shared/MermaidRenderer';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const SystemDesignPhase = ({ document, onUpdate }: PhaseProps) => {
    const [error, setError] = useState<string | null>(null);
    const { generateSystemArchitecture, isLoading: isGenerating } = useDesignArchitect();

    const handleGenerate = async () => {
        setError(null);
        try {
            const updatedDoc = await generateSystemArchitecture(document);
            onUpdate(updatedDoc);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full p-4">
            {/* Main Area */}
            <div className="md:col-span-2 flex flex-col h-full border rounded-lg bg-white overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700">System Architecture</h3>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isGenerating ? 'Generating...' : 'Generate New Architecture'}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-gray-50/50">
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded w-full max-w-2xl">
                            {error}
                        </div>
                    )}

                    {document.systemDesign?.architectureDiagramMermaid ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 bg-white border p-4 rounded shadow-sm overflow-auto">
                                <MermaidRenderer
                                    chart={document.systemDesign.architectureDiagramMermaid}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <p>No architecture generated yet.</p>
                            <p className="text-sm mt-2">Click generate to let AI propose a structure based on your analysis.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar info */}
            <div className="border rounded-lg p-4 bg-gray-50 h-full overflow-y-auto">
                <h3 className="font-bold text-gray-700 mb-4">Input Context</h3>
                <div className="text-sm text-gray-600 space-y-4">
                    <div>
                        <span className="font-semibold block mb-1">Project:</span>
                        {document.projectName}
                    </div>
                    <div>
                        <span className="font-semibold block mb-1">Analysis Status:</span>
                        {document.analysis?.completed ? '✅ Completed' : '⚠️ In Progress'}
                    </div>
                    <div>
                        <span className="font-semibold block mb-1">Use Cases:</span>
                        {document.analysis?.useCases?.length || 0} identified
                    </div>
                </div>
            </div>
        </div>
    );
};
