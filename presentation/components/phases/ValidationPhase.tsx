'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const ValidationPhase = ({ document, onUpdate }: PhaseProps) => {
    const [isValidating, setIsValidating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { validateDesign, generateReport } = useDesignArchitect();

    const handleValidate = async () => {
        setIsValidating(true);
        setError(null);
        try {
            const updatedDoc = await validateDesign(document);
            onUpdate(updatedDoc);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsValidating(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const result = await generateReport(document);
            setReport(result);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownload = () => {
        if (!report) return;
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.projectName || 'design-document'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Find the latest AI review
    const aiReview = document.validation?.reviews.find(r => r.author === 'AI Validator');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full p-6">
            {/* Validation Section */}
            <div className="flex flex-col border rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">1. Traceability Check</h3>
                    <button
                        onClick={handleValidate}
                        disabled={isValidating}
                        className={`px-4 py-2 rounded text-white text-sm font-medium ${isValidating ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {isValidating ? 'Validating...' : 'Validate Design'}
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-auto bg-gray-50/30">
                    {aiReview ? (
                        <div className="prose prose-sm max-w-none">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Validator Report ({new Date(aiReview.timestamp).toLocaleTimeString()})</h4>
                            <div className="whitespace-pre-wrap text-gray-700 font-mono text-xs bg-white p-3 border rounded">
                                {aiReview.content}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center mt-10 text-sm">Run validation to check use case coverage.</p>
                    )}
                </div>
            </div>

            {/* Export Section */}
            <div className="flex flex-col border rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">2. Final Report</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`px-4 py-2 rounded text-white text-sm font-medium ${isExporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {isExporting ? 'Generating...' : 'Generate Report'}
                        </button>
                        {report && (
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 rounded text-white text-sm font-medium bg-blue-600 hover:bg-blue-700"
                            >
                                Download
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-auto bg-gray-50/30">
                    {error && <div className="mb-4 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                    {report ? (
                        <div className="h-full flex flex-col">
                            <textarea
                                readOnly
                                value={report}
                                className="flex-1 w-full p-3 border rounded text-xs font-mono text-gray-700 mb-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <p className="text-xs text-center text-gray-500">
                                Copy the markdown above or click Download to save it to your computer.
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center mt-10 text-sm">Generate the final project report to view and export.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
