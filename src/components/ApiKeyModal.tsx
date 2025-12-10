import React, { useState, useEffect } from 'react';
import { Key, HelpCircle, ExternalLink, Trash2, X } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string, model: string) => void;
    onClear: () => void;
    onClose: () => void;
    initialKey?: string;
    initialModel?: string;
}

export const MODELS = [
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (推奨・高速)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (高精度)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (最高精度)' },
];

export function ApiKeyModal({ isOpen, onSave, onClear, onClose, initialKey = '', initialModel = 'gemini-2.5-flash-lite' }: ApiKeyModalProps) {
    const [key, setKey] = useState(initialKey);
    const [model, setModel] = useState(initialModel);

    // Track if modifications have been made to enable save
    const isModified = key !== initialKey || model !== initialModel;
    const isValid = key.trim().length > 0;

    useEffect(() => {
        setKey(initialKey);
        setModel(initialModel);
    }, [initialKey, initialModel]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onSave(key.trim(), model);
        }
    };

    const handleClear = () => {
        if (window.confirm('APIキーを削除してもよろしいですか？')) {
            onClear();
            setKey('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-mint-900/30 rounded-lg">
                            <Key className="w-5 h-5 text-mint-500" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Gemini API設定</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {initialKey && (
                            <button
                                onClick={handleClear}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium mr-2"
                                title="設定を削除する"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                設定を削除
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
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

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800/50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                閉じる
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid}
                                className={`px-6 py-2 rounded-lg font-medium transition-all shadow-lg text-white ${isValid
                                    ? 'bg-mint-600 hover:bg-mint-500 shadow-mint-900/20'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {initialKey && !isModified ? '保存済み' : '保存する'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
