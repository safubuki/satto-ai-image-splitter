import { RotateCcw } from 'lucide-react';
import { ResultGallery } from '../ResultGallery';
import { ImageOverlay } from '../ImageOverlay';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { type AnalyzeResponse } from '../../lib/geminiSplitter';
import { type CropResult } from '../../lib/imageProcessor';

interface DesktopResultLayoutProps {
    error: string | null;
    originalImage: string;
    analysisData: AnalyzeResponse | null;
    isProcessing: boolean;
    cropResults: CropResult[];
    onReset: () => void;
}

export function DesktopResultLayout({
    error,
    originalImage,
    analysisData,
    isProcessing,
    cropResults,
    onReset
}: DesktopResultLayoutProps) {
    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-medium text-gray-300">解析結果</h2>
            </div>

            <ErrorDisplay error={error} isMobile={false} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left: Visualization */}
                <div className="space-y-4 sm:space-y-4">
                    <p className="text-base sm:text-xl text-gray-500 font-mono uppercase tracking-wider">元画像 / 解析オーバーレイ</p>
                    <div className="relative rounded-2xl sm:rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900/50">
                        <ImageOverlay imageSrc={originalImage} analysisData={analysisData} />
                        {isProcessing && <LoadingSpinner isMobile={false} />}
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 text-base sm:text-lg font-bold text-white bg-gray-800 border border-gray-700 rounded-full shadow-lg transition-all hover:bg-gray-750 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 active:bg-gray-700 group"
                            title="Clear and start over"
                        >
                            <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" />
                            <span className="group-hover:text-red-100 transition-colors">Clear & New</span>
                        </button>
                    </div>
                </div>

                {/* Right: Results */}
                <div className="space-y-4 sm:space-y-4">
                    <p className="text-base sm:text-xl text-gray-500 font-mono uppercase tracking-wider">分割された画像</p>
                    {cropResults.length > 0 ? (
                        <ResultGallery results={cropResults} isMobile={false} />
                    ) : (
                        <div className="h-full min-h-[250px] sm:min-h-[400px] border-2 border-gray-800 border-dashed rounded-2xl sm:rounded-xl flex items-center justify-center text-gray-600 text-lg sm:text-2xl">
                            {isProcessing ? "解析結果を待っています..." : "まだ結果がありません"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
