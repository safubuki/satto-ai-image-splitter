import React, { useState, useEffect } from 'react';
import { Key, HelpCircle, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string, model: string) => void;
    onClose: () => void;
    initialKey?: string;
    initialModel?: string;
}

export const MODELS = [
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (推奨・高速)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (高精度)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (最高精度)' },
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
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-mint-900/30 rounded-lg">
                            <Key className="w-6 h-6 text-mint-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Gemini API設定</h2>
                    </div>
                </div>

                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                    AIによる分割機能を使用するには、Google Gemini APIキーが必要です。<br />
                    キーはブラウザ内にのみ保存され、外部サーバーには送信されません。
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="flex items-center gap-2 text-xs text-gray-400 uppercase font-medium mb-2">
                            API Key
                            <div className="relative group">
                                <HelpCircle className="w-4 h-4 text-gray-500 hover:text-mint-400 cursor-help transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                    <p className="font-bold text-mint-400 mb-1">設定方法:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Google AI Studioにアクセス</li>
                                        <li>"Get API key"をクリック</li>
                                        <li>"Create API key"でキーを作成</li>
                                        <li>コピーしてここに貼り付け</li>
                                    </ol>
                                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 border-r border-b border-gray-700 rotate-45"></div>
                                </div>
                            </div>
                        </label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50 mb-2 font-mono text-sm"
                        />
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-mint-500 hover:text-mint-400 flex items-center gap-1 inline-flex transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            APIキーを取得する (Google AI Studio)
                        </a>
                    </div>

                    <div className="mb-8 space-y-2">
                        <label className="text-xs text-gray-400 uppercase font-medium">使用モデル</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-mint-500/50 text-sm appearance-none cursor-pointer"
                        >
                            {MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">
                            ※ "429 Quota" エラーが出る場合は、しばらく待ってから再試行してください。
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-800/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!key.trim()}
                            className="px-6 py-2 bg-mint-600 hover:bg-mint-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-mint-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
