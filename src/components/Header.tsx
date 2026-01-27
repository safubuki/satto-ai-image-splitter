import { cn } from '../lib/utils';
import { Settings } from 'lucide-react';

interface HeaderProps {
    isMobile: boolean;
    onOpenSettings: () => void;
}

export function Header({ isMobile, onOpenSettings }: HeaderProps) {
    return (
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
            <div className={cn(
                "container mx-auto px-4 flex items-center justify-between gap-4",
                isMobile ? "py-6" : "h-20"
            )}>
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="relative group flex-shrink-0">
                        <div className="absolute inset-0 bg-mint-500/20 blur-lg rounded-full group-hover:bg-mint-500/30 transition-all duration-500" />
                        <img
                            src="icon.png"
                            alt="Logo"
                            className={cn(
                                "relative z-10 object-contain drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] group-hover:scale-110 transition-transform duration-300",
                                isMobile ? "w-24 h-24" : "w-10 h-10"
                            )}
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <span className={cn(
                            "font-bold tracking-[0.15em] text-mint-500 uppercase leading-none mb-2",
                            isMobile ? "text-[10px]" : "text-[10px]"
                        )}>
                            AI IMAGE SPLITTER
                        </span>
                        <h1 className={cn(
                            "font-bold text-white tracking-wide leading-none",
                            isMobile ? "text-xl" : "text-xl"
                        )}>
                            サッとAIイメージ分割
                        </h1>
                        {!isMobile && (
                            <p className="text-[11px] text-gray-400 leading-tight opacity-80 mt-1">
                                画像や漫画のコマをAIで自動検出
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onOpenSettings}
                    className={cn(
                        "hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex-shrink-0 active:bg-gray-700",
                        isMobile ? "p-5 rounded-2xl" : "p-2 rounded-lg"
                    )}
                    title="API Settings"
                >
                    <Settings className={isMobile ? "w-14 h-14" : "w-6 h-6"} />
                </button>
            </div>
        </header>
    );
}
