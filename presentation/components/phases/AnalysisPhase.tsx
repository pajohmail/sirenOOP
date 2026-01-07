'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState } from 'react';
import { MermaidRenderer } from '../shared/MermaidRenderer';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';

interface AnalysisPhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const AnalysisPhase = ({ document, onUpdate }: AnalysisPhaseProps) => {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
        { role: 'ai', content: 'Hello! Tell me about the system you want to build. Who are the users and what are their goals?' }
    ]);
    const { analyzeChat } = useDesignArchitect();

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: chatInput }];
        setMessages(newMessages);
        const userMessage = chatInput;
        setChatInput('');

        try {
            setMessages(prev => [...prev, { role: 'ai', content: 'Analyzing...' }]);

            const { document: updatedDoc, reply } = await analyzeChat(document, userMessage);

            onUpdate(updatedDoc);

            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analyzing...'),
                { role: 'ai', content: reply }
            ]);

        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analyzing...'),
                { role: 'ai', content: `Error: ${errorMessage}` }
            ]);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-[600px] border rounded-lg">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your requirements..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Artifacts Sidebar */}
            <div className="border rounded-lg p-4 bg-gray-50 overflow-y-auto h-[600px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Identified Artifacts
                </h3>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Use Cases</h4>
                        {document.analysis?.useCases && document.analysis.useCases.length > 0 ? (
                            <ul className="space-y-2">
                                {document.analysis.useCases.map(uc => (
                                    <li key={uc.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 text-sm">
                                        <span className="font-medium block text-gray-800">{uc.title}</span>
                                        <span className="text-gray-500 text-xs truncate block">{uc.narrative}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No use cases identified yet.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Domain Model</h4>
                        {document.analysis?.domainModelMermaid ? (
                            <MermaidRenderer
                                chart={document.analysis.domainModelMermaid}
                                className="bg-white p-4 rounded border overflow-x-auto"
                            />
                        ) : (
                            <p className="text-sm text-gray-400 italic">Domain model pending...</p>
                        )}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={async () => {
                            if (document.analysis?.useCases && document.analysis.useCases.length > 0) {
                                onUpdate({
                                    ...document,
                                    currentPhase: 'systemDesign',
                                    analysis: { ...document.analysis, completed: true }
                                });
                            } else {
                                const { document: updated } = await analyzeChat(document, "Please finalize the Use Cases based on our discussion so far.");

                                onUpdate({
                                    ...updated,
                                    currentPhase: 'systemDesign',
                                    analysis: { ...updated.analysis!, completed: true }
                                });
                            }
                        }}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold shadow-sm transition-colors"
                    >
                        <span>🚀 Generate & Continue</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        Click to stop chatting and proceed to System Design with current info.
                    </p>
                </div>
            </div>
        </div>
    );
};
