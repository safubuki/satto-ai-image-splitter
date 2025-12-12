import { type CropResult } from '../lib/imageProcessor';
import { Download } from 'lucide-react';

interface ResultGalleryProps {
    results: CropResult[];
}

export function ResultGallery({ results }: ResultGalleryProps) {
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
        <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">分割画像 ({results.length})</h3>
                <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 sm:gap-2 px-4 py-3 sm:px-4 sm:py-2 md:px-6 md:py-3.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-xl sm:rounded-lg transition-colors text-sm sm:text-sm md:text-lg font-medium"
                >
                    <Download className="w-5 h-5 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                    <span className="sm:inline">Download All</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-4 md:gap-6">
                {results.map((crop) => (
                    <div
                        key={crop.id}
                        className="group relative bg-gray-800 rounded-2xl sm:rounded-lg overflow-hidden border border-gray-700 transition-all hover:border-mint-500/50 hover:shadow-lg hover:shadow-mint-500/10 active:scale-[0.98]"
                    >
                        <div className="aspect-square w-full relative bg-gray-900/50">
                            <img
                                src={crop.url}
                                alt={crop.label}
                                className="w-full h-full object-contain p-2 sm:p-2"
                            />
                        </div>

                        <div className="p-3 sm:p-3 md:p-5 bg-gray-800 border-t border-gray-700">
                            <p className="text-xs sm:text-xs md:text-base font-mono text-gray-400 truncate mb-3 sm:mb-2 md:mb-4" title={crop.label}>
                                {crop.label}
                            </p>
                            <button
                                onClick={() => handleDownload(crop)}
                                className="w-full flex items-center justify-center gap-2 sm:gap-2 px-3 py-3 sm:px-3 sm:py-1.5 md:px-5 md:py-3 bg-gray-700 hover:bg-mint-600 active:bg-mint-700 hover:text-white text-gray-300 rounded-xl sm:rounded mb-1 transition-colors text-sm sm:text-xs md:text-lg font-medium"
                            >
                                <Download className="w-4 h-4 sm:w-3 sm:h-3 md:w-5 md:h-5" />
                                Save
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
