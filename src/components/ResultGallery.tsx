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
                    className="flex items-center gap-3 md:gap-2 px-8 py-5 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-xl md:rounded-lg transition-colors text-lg md:text-sm font-medium"
                >
                    <Download className="w-6 h-6 md:w-4 md:h-4" />
                    <span className="md:inline">Download All</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {results.map((crop) => (
                    <div
                        key={crop.id}
                        className="group relative bg-gray-800 rounded-2xl md:rounded-lg overflow-hidden border border-gray-700 transition-all hover:border-mint-500/50 hover:shadow-lg hover:shadow-mint-500/10 active:scale-[0.98]"
                    >
                        <div className="aspect-square w-full relative bg-gray-900/50">
                            <img
                                src={crop.url}
                                alt={crop.label}
                                className="w-full h-full object-contain p-2 md:p-2"
                            />
                        </div>

                        <div className="p-5 md:p-4 bg-gray-800 border-t border-gray-700">
                            <p className="text-lg md:text-sm font-mono text-gray-400 truncate mb-5 md:mb-3" title={crop.label}>
                                {crop.label}
                            </p>
                            <button
                                onClick={() => handleDownload(crop)}
                                className="w-full flex items-center justify-center gap-3 md:gap-2 px-6 py-5 md:py-2 bg-gray-700 hover:bg-mint-600 active:bg-mint-700 hover:text-white text-gray-300 rounded-xl md:rounded mb-1 transition-colors text-lg md:text-xs font-bold"
                            >
                                <Download className="w-6 h-6 md:w-4 md:h-4" />
                                Save
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
