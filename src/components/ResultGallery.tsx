import { type CropResult } from '../lib/imageProcessor';
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResultGalleryProps {
    results: CropResult[];
    isMobile?: boolean;
}

export function ResultGallery({ results, isMobile = false }: ResultGalleryProps) {
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
        <div className={cn("space-y-6", isMobile && "space-y-10")}>
            <div className="flex items-center justify-between gap-4">
                <h3 className={cn(
                    "font-bold text-white",
                    isMobile ? "text-3xl" : "text-xl md:text-2xl"
                )}>
                    分割画像 ({results.length})
                </h3>
                <button
                    onClick={handleDownloadAll}
                    className={cn(
                        "flex items-center bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white transition-colors font-bold",
                        isMobile
                            ? "gap-3 px-8 py-5 rounded-2xl text-xl"
                            : "gap-2 px-4 py-2 rounded-lg text-sm"
                    )}
                >
                    <Download className={isMobile ? "w-7 h-7" : "w-4 h-4"} />
                    <span>すべて保存</span>
                </button>
            </div>

            {/* Mobile: 1 column, Desktop: 2 columns */}
            <div className={cn(
                "grid gap-6",
                isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
                {results.map((crop) => (
                    <div
                        key={crop.id}
                        className={cn(
                            "group relative bg-gray-800 overflow-hidden border border-gray-700 transition-all hover:border-mint-500/50 hover:shadow-lg hover:shadow-mint-500/10 active:scale-[0.98]",
                            isMobile ? "rounded-2xl" : "rounded-lg"
                        )}
                    >
                        <div className="aspect-square w-full relative bg-gray-900/50">
                            <img
                                src={crop.url}
                                alt={crop.label}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>

                        <div className={cn(
                            "bg-gray-800 border-t border-gray-700",
                            isMobile ? "p-5" : "p-4"
                        )}>
                            <p
                                className={cn(
                                    "font-mono text-gray-400 truncate",
                                    isMobile ? "text-lg mb-4" : "text-sm mb-3"
                                )}
                                title={crop.label}
                            >
                                {crop.label}
                            </p>
                            <button
                                onClick={() => handleDownload(crop)}
                                className={cn(
                                    "w-full flex items-center justify-center bg-gray-700 hover:bg-mint-600 active:bg-mint-700 hover:text-white text-gray-300 transition-colors font-bold",
                                    isMobile
                                        ? "gap-3 px-8 py-6 rounded-2xl text-xl"
                                        : "gap-2 px-4 py-2 rounded text-sm"
                                )}
                            >
                                <Download className={isMobile ? "w-7 h-7" : "w-4 h-4"} />
                                保存
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
