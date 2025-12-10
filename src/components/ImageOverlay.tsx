import { type AnalyzeResponse } from '../lib/geminiSplitter';

interface ImageOverlayProps {
    imageSrc: string;
    analysisData: AnalyzeResponse | null;
}

export function ImageOverlay({ imageSrc, analysisData }: ImageOverlayProps) {
    if (!imageSrc) return null;

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-xl">
            <img
                src={imageSrc}
                alt="Original"
                className="w-full h-auto block"
            />

            {analysisData?.crops.map((crop, index) => {
                const [ymin, xmin, ymax, xmax] = crop.box_2d;

                // Convert to percentage for CSS absolute positioning
                const top = ymin * 100;
                const left = xmin * 100;
                const width = (xmax - xmin) * 100;
                const height = (ymax - ymin) * 100;

                return (
                    <div
                        key={index}
                        className="absolute border-2 border-mint-500 bg-mint-500/10 hover:bg-mint-500/20 transition-colors group"
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                        }}
                    >
                        <div className="absolute top-0 left-0 bg-mint-500 text-black text-[10px] font-bold px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                            {crop.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
