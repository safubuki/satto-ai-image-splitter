import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string, model: string) => void;
    onClose: () => void;
    initialKey?: string;
    initialModel?: string;
}

export const MODELS = [
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Recommended)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (High Accuracy)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Best Accuracy)' },
];

export function ApiKeyModal({ isOpen, onSave, onClose, initialKey = '', initialModel = 'gemini-2.5-flash-lite' }: ApiKeyModalProps) {
    const [key, setKey] = useState(initialKey);
    const [model, setModel] = useState(initialModel);

    useEffect(() => {
        setKey(initialKey);
        setModel(initialModel);
    }, [initialKey, initialModel]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onSave(key.trim(), model);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-mint-900/30 rounded-lg">
                        <Key className="w-6 h-6 text-mint-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Gemini API Key</h2>
                </div>

                <p className="text-gray-400 mb-6 text-sm">
                    To use the AI splicing features, you need to provide a Google Gemini API Key.
                    It will be stored locally in your browser.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50 mb-4 font-mono text-sm"
                    />

                    <div className="mb-6 space-y-2">
                        <label className="text-xs text-gray-400 uppercase font-medium">Model</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-mint-500/50 text-sm appearance-none"
                        >
                            {MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">
                            Try switching to 1.5 Flash if you hit rate limits with 2.0.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!key.trim()}
                            className="px-6 py-2 bg-mint-600 hover:bg-mint-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Key
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
