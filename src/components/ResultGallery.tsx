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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-3xl md:text-xl font-bold text-white">Splitted Images ({results.length})</h3>
                <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 px-6 py-3.5 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-lg md:text-sm font-medium"
                >
                    <Download className="w-6 h-6 md:w-4 md:h-4" />
                    Download All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
                {results.map((crop) => (
                    <div
                        key={crop.id}
                        className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 transition-all hover:border-mint-500/50 hover:shadow-lg hover:shadow-mint-500/10"
                    >
                        <div className="aspect-square w-full relative bg-gray-900/50">
                            <img
                                src={crop.url}
                                alt={crop.label}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>

                        <div className="p-5 md:p-3 bg-gray-800 border-t border-gray-700">
                            <p className="text-base md:text-xs font-mono text-gray-400 truncate mb-4 md:mb-2" title={crop.label}>
                                {crop.label}
                            </p>
                            <button
                                onClick={() => handleDownload(crop)}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 md:px-3 md:py-1.5 bg-gray-700 hover:bg-mint-600 hover:text-white text-gray-300 rounded mb-1 transition-colors text-lg md:text-xs font-medium"
                            >
                                <Download className="w-5 h-5 md:w-3 md:h-3" />
                                Save
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
