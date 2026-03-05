import { Edit3 } from 'lucide-react';
import { ResultGallery } from '../ResultGallery';
import { ImageOverlay } from '../ImageOverlay';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { type AnalyzeResponse } from '../../lib/geminiSplitter';
import { type CropResult } from '../../lib/imageProcessor';

interface MobileResultLayoutProps {
    error: string | null;
    originalImage: string;
    analysisData: AnalyzeResponse | null;
    isProcessing: boolean;
    cropResults: CropResult[];
    onReEdit?: () => void;
}

export function MobileResultLayout({
    error,
    originalImage,
    analysisData,
    isProcessing,
    cropResults,
    onReEdit
}: MobileResultLayoutProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ErrorDisplay error={error} isMobile={true} />

            {/* Mobile: Single column - Original image first */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">解析結果</h3>
                    <p className="text-sm text-gray-500">元画像 / 解析オーバーレイ</p>
                </div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900/50">
                    <ImageOverlay imageSrc={originalImage} analysisData={analysisData} />
                    {isProcessing && <LoadingSpinner isMobile={true} />}
                </div>
                {onReEdit && (
                    <button
                        onClick={onReEdit}
                        className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-xl transition-colors text-sm font-bold border border-yellow-500/30 w-full"
                    >
                        <Edit3 className="w-4 h-4 text-yellow-400" />
                        矩形を再調整
                    </button>
                )}
            </div>

            {/* Mobile: Results section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">分割画像 ({cropResults.length})</h3>
                    <p className="text-sm text-gray-500">分割された画像</p>
                </div>
                {cropResults.length > 0 ? (
                    <ResultGallery results={cropResults} isMobile={true} />
                ) : (
                    <div className="min-h-[250px] border-2 border-gray-800 border-dashed rounded-3xl flex items-center justify-center text-gray-600 text-base">
                        {isProcessing ? "解析結果を待っています..." : "まだ結果がありません"}
                    </div>
                )}
            </div>
        </div>
    );
}
