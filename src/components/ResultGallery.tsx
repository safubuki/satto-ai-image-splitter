import { type CropResult } from '../lib/imageProcessor';
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResultGalleryProps {
    results: CropResult[];
    isMobile?: boolean;
    showHeader?: boolean;
}

export function ResultGallery({ results, isMobile = false, showHeader = true }: ResultGalleryProps) {
    if (results.length === 0) return null;

    const handleDownload = (crop: CropResult) => {
        const link = document.createElement('a');
        link.href = crop.url;
        link.download = `${crop.label.replace(/\s+/g, '_')}_${crop.id.slice(0, 4)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        // Sequential download with a small delay to prevent browser blocking
        results.forEach((crop, i) => {
            setTimeout(() => handleDownload(crop), i * 300);
        });
    };

    return (
        <div className={cn("space-y-6", isMobile && "space-y-8")}>
            {/* Desktop only: download all button */}
            {!isMobile && showHeader && (
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-white text-2xl mb-1">
                            分割画像 ({results.length})
                        </h3>
                    </div>
                    <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm bg-mint-600 hover:bg-mint-500 active:bg-mint-700 text-white transition-colors font-bold shadow-lg shadow-mint-500/20"
                    >
                        <Download className="w-5 h-5" />
                        <span>全てダウンロード</span>
                    </button>
                </div>
            )}


            {/* Mobile: 1 column, Desktop: 2 columns */}
            <div className={cn(
                "grid",
                isMobile ? "grid-cols-1 gap-10" : "grid-cols-2 gap-6"
            )}>
                {results.map((crop) => (
                    <div
                        key={crop.id}
                        className={cn(
                            "group relative bg-gray-800 overflow-hidden border border-gray-700 transition-all hover:border-mint-500/50 hover:shadow-lg hover:shadow-mint-500/10 active:scale-[0.98]",
                            isMobile ? "rounded-3xl" : "rounded-lg"
                        )}
                    >
                        <div className={cn(
                            "w-full relative bg-gray-900/50",
                            isMobile ? "aspect-square" : "aspect-[7/5]"
                        )}>
                            <img
                                src={crop.url}
                                alt={crop.label}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>

                        <div className={cn(
                            "bg-gray-800 border-t border-gray-700",
                            isMobile ? "p-4" : "p-4"
                        )}>
                            <p
                                className={cn(
                                    "font-mono text-gray-400 truncate",
                                    isMobile ? "text-sm mb-3" : "text-sm mb-3"
                                )}
                                title={crop.label}
                            >
                                {crop.label}
                            </p>
                            <button
                                onClick={() => handleDownload(crop)}
                                className={cn(
                                    "w-full flex items-center justify-center text-gray-300 font-bold transition-all",
                                    isMobile
                                        ? "gap-2 px-4 py-3 rounded-xl text-base bg-gray-700 hover:bg-mint-600 active:bg-mint-700 hover:text-white"
                                        : "gap-2 px-4 py-2 rounded-full text-sm bg-gray-700 border border-gray-600 hover:bg-gray-650 hover:border-mint-500/50 hover:text-white active:scale-[0.98]"
                                )}
                            >
                                <Download className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                                保存
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
