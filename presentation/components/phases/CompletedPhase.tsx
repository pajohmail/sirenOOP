'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState, useEffect } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';
import { useAuth } from '@/presentation/hooks/useAuth';
import { generateProjectsZip, downloadBlob } from '@/utils/zipGenerator';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const CompletedPhase = ({ document: designDoc, onUpdate }: PhaseProps) => {
    const [isGeneratingZip, setIsGeneratingZip] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { generateReport } = useDesignArchitect();
    const { user } = useAuth();

    const report = designDoc.validation?.generatedReport;

    // Fallback: Auto-generate report if missing
    useEffect(() => {
        if (!report && !isGeneratingReport) {
            setIsGeneratingReport(true);
            generateReport(designDoc)
                .then(generatedReport => {
                    onUpdate({
                        ...designDoc,
                        validation: {
                            ...designDoc.validation!,
                            generatedReport,
                            reportGeneratedAt: new Date()
                        }
                    });
                })
                .catch(err => {
                    console.error('Failed to generate report:', err);
                    setError(err instanceof Error ? err.message : 'Failed to generate report');
                })
                .finally(() => setIsGeneratingReport(false));
        }
    }, [report, designDoc, onUpdate, generateReport, isGeneratingReport]);

    const handleDownloadSingle = () => {
        if (!report) return;
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${designDoc.projectName || 'design-document'}.md`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAllZip = async () => {
        if (!user?.uid) {
            setError('You must be logged in to download all projects');
            return;
        }

        setIsGeneratingZip(true);
        setError(null);

        try {
            // Dynamically import Firebase and repositories
            const { db } = await import('@/config/firebase');
            const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
            const { DesignArchitectService } = await import('@/services/DesignArchitectService');
            const { GeminiRepository } = await import('@/repositories/GeminiRepository');

            const firestoreRepo = new FirestoreRepository(db);
            const allDocs = await firestoreRepo.getUserDesignDocuments(user.uid);

            // Filter only completed documents
            const completedDocs = allDocs.filter(d => d.currentPhase === 'completed');

            if (completedDocs.length === 0) {
                setError('No completed projects to download. Complete at least one project first.');
                return;
            }

            // Get API key from user settings or use default
            const geminiApiKey = (user as any).geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
            const geminiRepo = new GeminiRepository(geminiApiKey);
            const service = new DesignArchitectService(geminiRepo);

            const zipBlob = await generateProjectsZip(completedDocs, service);
            downloadBlob(zipBlob, `sirenoop-designs-${new Date().toISOString().split('T')[0]}.zip`);
        } catch (err) {
            console.error('Failed to generate ZIP:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate ZIP file');
        } finally {
            setIsGeneratingZip(false);
        }
    };

    const useCaseCount = designDoc.analysis?.useCases.length || 0;
    const isApproved = designDoc.validation?.isApproved || false;
    const reportDate = designDoc.validation?.reportGeneratedAt
        ? new Date(designDoc.validation.reportGeneratedAt).toLocaleString()
        : 'Just now';

    return (
        <div className="grid grid-cols-1 gap-6 p-6 max-w-7xl mx-auto">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h2 className="text-3xl font-bold">Design Complete!</h2>
                        <p className="text-lg mt-1 opacity-90">
                            Your <span className="font-semibold">{designDoc.projectName}</span> design document is ready
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Use Cases</div>
                    <div className="text-3xl font-bold text-blue-600">{useCaseCount}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Validation Status</div>
                    <div className={`text-3xl font-bold ${isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isApproved ? 'Approved' : 'Pending'}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Generated</div>
                    <div className="text-lg font-semibold text-gray-700">{reportDate}</div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Report Preview */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Final Design Document</h3>
                {isGeneratingReport ? (
                    <div className="flex items-center justify-center p-12">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Generating report...</span>
                    </div>
                ) : report ? (
                    <textarea
                        readOnly
                        value={report}
                        className="w-full h-96 p-4 border rounded-lg text-sm font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    />
                ) : (
                    <p className="text-gray-400 text-center py-12">Report not available</p>
                )}
            </div>

            {/* Download Buttons */}
            <div className="flex gap-4 justify-center">
                <button
                    onClick={handleDownloadSingle}
                    disabled={!report || isGeneratingReport}
                    className={`px-6 py-3 rounded-lg text-white text-base font-medium flex items-center gap-2 ${
                        !report || isGeneratingReport
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
                    </svg>
                    Download This Document
                </button>

                <button
                    onClick={handleDownloadAllZip}
                    disabled={isGeneratingZip}
                    className={`px-6 py-3 rounded-lg text-white text-base font-medium flex items-center gap-2 ${
                        isGeneratingZip
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all'
                    }`}
                >
                    {isGeneratingZip ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating ZIP...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download All Projects (ZIP)
                        </>
                    )}
                </button>
            </div>

            {/* Diagram Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {designDoc.analysis?.domainModelMermaid && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Domain Model</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.analysis.domainModelMermaid}
                        </pre>
                    </div>
                )}

                {designDoc.systemDesign?.architectureDiagramMermaid && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">System Architecture</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.systemDesign.architectureDiagramMermaid}
                        </pre>
                    </div>
                )}

                {designDoc.objectDesign?.classDiagramMermaid && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Class Diagram</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.objectDesign.classDiagramMermaid}
                        </pre>
                    </div>
                )}

                {designDoc.validation?.reviews && designDoc.validation.reviews.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Validation Report</h4>
                        <div className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.validation.reviews[0]?.content || 'No validation report available'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
