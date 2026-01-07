'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState } from 'react';
import { validateDesignAction, generateReportAction } from '@/app/actions/aiActions';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
    userToken?: string;
}

export const ValidationPhase = ({ document, onUpdate, userToken }: PhaseProps) => {
    const [isValidating, setIsValidating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleValidate = async () => {
        if (!userToken) {
            setError("No user token available.");
            return;
        }
        setIsValidating(true);
        setError(null);
        try {
            const updatedDoc = await validateDesignAction(document, userToken);
            onUpdate(updatedDoc);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsValidating(false);
        }
    };

    const handleExport = async () => {
        if (!userToken) {
            setError("No user token available.");
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const result = await generateReportAction(document, userToken);
            setReport(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsExporting(false);
        }
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
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className={`px-4 py-2 rounded text-white text-sm font-medium ${isExporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {isExporting ? 'Generating...' : 'Generate Report'}
                    </button>
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
                                Copy the markdown above to create your README.md or documentation.
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
