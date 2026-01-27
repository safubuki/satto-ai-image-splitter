import React, { useState, useEffect } from 'react';
import { Key, HelpCircle, ExternalLink, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string, model: string) => void;
    onClear: () => void;
    onClose: () => void;
    initialKey?: string;
    initialModel?: string;
    isMobile?: boolean;
}

export const MODELS = [
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (推奨・高速)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (高精度)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (最高精度)' },
];

export function ApiKeyModal({ isOpen, onSave, onClear, onClose, initialKey = '', initialModel = 'gemini-2.5-flash-lite', isMobile = false }: ApiKeyModalProps) {
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
        <div className={cn(
            "fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200",
            isMobile ? "items-end p-0" : "items-center p-4"
        )}>
            <div className={cn(
                "w-full bg-gray-900 border border-gray-800 shadow-2xl overflow-y-auto",
                isMobile
                    ? "max-h-[95vh] rounded-t-3xl"
                    : "max-w-lg max-h-[95vh] rounded-xl"
            )}>
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10",
                    isMobile
                        ? "p-8 rounded-t-3xl"
                        : "p-6 rounded-t-xl"
                )}>
                    <div className={cn("flex items-center", isMobile ? "gap-2.5" : "gap-3")}>
                        <div className={cn(
                            "bg-mint-900/30",
                            isMobile ? "p-2.5 rounded-xl" : "p-2.5 rounded-lg"
                        )}>
                            <Key className={isMobile ? "w-6 h-6 text-mint-500" : "w-5 h-5 text-mint-500"} />
                        </div>
                        <h2 className={cn(
                            "font-bold text-white",
                            isMobile ? "text-xl" : "text-lg"
                        )}>API設定</h2>
                    </div>
                    <div className={cn("flex items-center", isMobile ? "gap-2" : "gap-2")}>
                        {initialKey && (
                            <button
                                onClick={handleClear}
                                className={cn(
                                    "text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors flex items-center font-medium active:bg-red-900/30",
                                    isMobile
                                        ? "px-3 py-2 rounded-xl gap-1.5 text-base"
                                        : "px-3 py-1.5 rounded-lg gap-2 text-xs"
                                )}
                                title="設定を削除する"
                            >
                                <Trash2 className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
                                {!isMobile && <span>設定を削除</span>}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={cn(
                                "text-gray-500 hover:text-white hover:bg-gray-800 transition-colors active:bg-gray-700",
                                isMobile ? "p-2.5 rounded-xl" : "p-2 rounded-lg"
                            )}
                        >
                            <X className={isMobile ? "w-6 h-6" : "w-5 h-5"} />
                        </button>
                    </div>
                </div>

                <div className={isMobile ? "p-4" : "p-6"}>
                    <p className={cn(
                        "text-gray-400 leading-relaxed",
                        isMobile ? "mb-5 text-base" : "mb-6 text-base"
                    )}>
                        AIによる分割機能を使用するには、Google Gemini APIキーが必要です。
                        <br />
                        <span className={cn("text-gray-500", isMobile ? "text-xs" : "text-sm")}>
                            キーはブラウザ内にのみ保存されます。
                        </span>
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className={isMobile ? "mb-4" : "mb-6"}>
                            <label className={cn(
                                "flex items-center text-gray-400 uppercase font-medium",
                                isMobile ? "gap-2 text-base mb-3" : "gap-2 text-xs mb-3"
                            )}>
                                API Key
                                <div className="relative group">
                                    <HelpCircle className={cn(
                                        "text-gray-500 hover:text-mint-400 cursor-help transition-colors",
                                        isMobile ? "w-5 h-5" : "w-4 h-4"
                                    )} />
                                    {!isMobile && (
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
                                    )}
                                </div>
                            </label>
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className={cn(
                                    "w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50 font-mono",
                                    isMobile
                                        ? "rounded-xl px-4 py-4 text-xl mb-3"
                                        : "rounded-lg px-4 py-3 text-base mb-3"
                                )}
                            />
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "text-mint-500 hover:text-mint-400 flex items-center inline-flex transition-colors",
                                    isMobile ? "gap-2 text-base" : "gap-1.5 text-xs"
                                )}
                            >
                                <ExternalLink className={isMobile ? "w-5 h-5" : "w-3 h-3"} />
                                APIキーを取得する (Google AI Studio)
                            </a>
                        </div>

                        <div className={cn("space-y-2", isMobile ? "mb-5" : "mb-8")}>
                            <label className={cn(
                                "text-gray-400 uppercase font-medium",
                                isMobile ? "text-base" : "text-xs"
                            )}>使用モデル</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className={cn(
                                    "w-full bg-gray-950 border border-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-mint-500/50 appearance-none cursor-pointer",
                                    isMobile
                                        ? "rounded-xl px-4 py-4 text-base"
                                        : "rounded-lg px-4 py-2.5 text-base"
                                )}
                            >
                                {MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <p className={cn("text-gray-500", isMobile ? "text-xs" : "text-xs")}>
                                ※ "429 Quota" エラーが出る場合は、しばらく待ってから再試行してください。
                            </p>
                        </div>

                        <div className={cn(
                            "flex justify-end border-t border-gray-800/50",
                            isMobile
                                ? "flex-col gap-2.5 pt-4"
                                : "flex-row gap-3 pt-6"
                        )}>
                            <button
                                type="button"
                                onClick={onClose}
                                className={cn(
                                    "text-gray-400 hover:text-white transition-colors font-medium hover:bg-gray-800 active:bg-gray-700",
                                    isMobile
                                        ? "w-full px-5 py-4 text-xl rounded-xl order-2"
                                        : "px-4 py-2 text-sm rounded-lg order-1"
                                )}
                            >
                                閉じる
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid}
                                className={cn(
                                    "font-medium transition-all shadow-lg text-white",
                                    isMobile
                                        ? "w-full px-5 py-4 text-xl rounded-xl order-1"
                                        : "px-6 py-2 text-sm rounded-lg order-2",
                                    isValid
                                        ? 'bg-mint-600 hover:bg-mint-500 shadow-mint-900/20 active:bg-mint-700'
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                )}
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

