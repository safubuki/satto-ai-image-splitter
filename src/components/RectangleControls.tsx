import { useRef, useEffect, useCallback } from 'react';
import { type SplitResult } from '../lib/geminiSplitter';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Move, Maximize2, Scissors } from 'lucide-react';
import { cn } from '../lib/utils';

interface RectangleControlsProps {
    crops: SplitResult[];
    selectedIndex: number;
    onSelectCrop: (index: number) => void;
    onUpdateCrop: (index: number, newBox: [number, number, number, number]) => void;
    onExecute: () => void;
    onReset: () => void;
    step: number;
    onStepChange: (step: number) => void;
    isMobile: boolean;
    isProcessing: boolean;
}

const STEP_OPTIONS = [
    { label: '微', value: 0.005 },
    { label: '標', value: 0.02 },
    { label: '大', value: 0.05 },
];

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

// D-pad button with press-and-hold repeat
function DPadButton({ onAction, icon, colorClass, size }: {
    onAction: () => void;
    icon: React.ReactNode;
    colorClass: string;
    size: number;
}) {
    const callbackRef = useRef(onAction);
    callbackRef.current = onAction;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = useCallback(() => {
        callbackRef.current();
        intervalRef.current = setInterval(() => callbackRef.current(), 100);
    }, []);

    const stop = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => () => stop(), [stop]);

    return (
        <button
            onPointerDown={(e) => { e.preventDefault(); start(); }}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            className={cn(
                "flex items-center justify-center rounded-xl border border-gray-600 bg-gray-800 transition-all select-none active:scale-95",
                colorClass
            )}
            style={{ width: size, height: size, touchAction: 'none' }}
        >
            {icon}
        </button>
    );
}

// D-pad layout (3x3 grid)
function DPad({ onUp, onDown, onLeft, onRight, colorClass, centerColorClass, btnSize, label, sublabel, centerIcon }: {
    onUp: () => void;
    onDown: () => void;
    onLeft: () => void;
    onRight: () => void;
    colorClass: string;
    centerColorClass: string;
    btnSize: number;
    label: string;
    sublabel: string;
    centerIcon: React.ReactNode;
}) {
    const iconSize = btnSize * 0.45;
    const gap = 3;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1 mb-0.5">
                {centerIcon}
                <span className={cn("text-sm font-bold", centerColorClass)}>{label}</span>
            </div>
            <div
                className="inline-grid"
                style={{
                    gridTemplateColumns: `${btnSize}px ${btnSize}px ${btnSize}px`,
                    gridTemplateRows: `${btnSize}px ${btnSize}px ${btnSize}px`,
                    gap: `${gap}px`,
                }}
            >
                <div />
                <DPadButton onAction={onUp} icon={<ChevronUp size={iconSize} />} colorClass={colorClass} size={btnSize} />
                <div />
                <DPadButton onAction={onLeft} icon={<ChevronLeft size={iconSize} />} colorClass={colorClass} size={btnSize} />
                <div className={cn(
                    "flex items-center justify-center rounded-xl border",
                    centerColorClass === 'text-cyan-400' ? 'bg-cyan-950/40 border-cyan-800/40' : 'bg-amber-950/40 border-amber-800/40'
                )} style={{ width: btnSize, height: btnSize }}>
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        centerColorClass === 'text-cyan-400' ? 'bg-cyan-500/40' : 'bg-amber-500/40'
                    )} />
                </div>
                <DPadButton onAction={onRight} icon={<ChevronRight size={iconSize} />} colorClass={colorClass} size={btnSize} />
                <div />
                <DPadButton onAction={onDown} icon={<ChevronDown size={iconSize} />} colorClass={colorClass} size={btnSize} />
                <div />
            </div>
            <span className="text-[11px] text-gray-500 mt-0.5">{sublabel}</span>
        </div>
    );
}

export function RectangleControls({
    crops, selectedIndex, onSelectCrop, onUpdateCrop,
    onExecute, onReset, step, onStepChange, isMobile, isProcessing
}: RectangleControlsProps) {
    const btnSize = isMobile ? 48 : 40;
    const MIN_DIM = 0.02;

    const adjustPosition = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        const crop = crops[selectedIndex];
        if (!crop) return;
        const [ymin, xmin, ymax, xmax] = crop.box_2d;
        const w = xmax - xmin, h = ymax - ymin;
        let ny = ymin, nx = xmin;

        switch (direction) {
            case 'up':    ny = Math.max(0, ymin - step); break;
            case 'down':  ny = Math.min(1 - h, ymin + step); break;
            case 'left':  nx = Math.max(0, xmin - step); break;
            case 'right': nx = Math.min(1 - w, xmin + step); break;
        }

        onUpdateCrop(selectedIndex, [ny, nx, ny + h, nx + w]);
    }, [crops, selectedIndex, step, onUpdateCrop]);

    const adjustSize = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        const crop = crops[selectedIndex];
        if (!crop) return;
        let [ymin, xmin, ymax, xmax] = crop.box_2d;

        // Anchor at top-left: only move ymax/xmax
        switch (direction) {
            case 'up': // taller
                ymax = Math.min(1, ymax + step);
                break;
            case 'down': // shorter
                ymax = Math.max(ymin + MIN_DIM, ymax - step);
                break;
            case 'right': // wider
                xmax = Math.min(1, xmax + step);
                break;
            case 'left': // narrower
                xmax = Math.max(xmin + MIN_DIM, xmax - step);
                break;
        }

        onUpdateCrop(selectedIndex, [ymin, xmin, ymax, xmax]);
    }, [crops, selectedIndex, step, onUpdateCrop]);

    const selectedCrop = crops[selectedIndex];

    return (
        <div className={cn(
            "bg-gray-900/80 border border-gray-700 rounded-2xl p-4 space-y-4",
            isMobile ? "backdrop-blur-md" : ""
        )}>
            {/* Crop selector */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onSelectCrop(Math.max(0, selectedIndex - 1))}
                    disabled={selectedIndex === 0}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-30 hover:bg-gray-700 active:bg-gray-600 transition-colors"
                    style={{ touchAction: 'none' }}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center min-w-0">
                    <span className="text-yellow-400 font-bold text-base">
                        矩形 {selectedIndex + 1}
                    </span>
                    <span className="text-gray-500 text-base"> / {crops.length}</span>
                    {selectedCrop && (
                        <p className="text-gray-400 text-xs truncate mt-0.5">{selectedCrop.label}</p>
                    )}
                </div>
                <button
                    onClick={() => onSelectCrop(Math.min(crops.length - 1, selectedIndex + 1))}
                    disabled={selectedIndex === crops.length - 1}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-600 disabled:opacity-30 hover:bg-gray-700 active:bg-gray-600 transition-colors"
                    style={{ touchAction: 'none' }}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Step size selector */}
            <div className="flex items-center gap-2 justify-center">
                <span className="text-gray-500 text-sm">調整量:</span>
                {STEP_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onStepChange(opt.value)}
                        className={cn(
                            "px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors",
                            step === opt.value
                                ? "bg-mint-600 text-white shadow-md shadow-mint-500/20"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-600"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* D-Pads */}
            <div className="flex justify-center gap-4 sm:gap-6">
                <DPad
                    onUp={() => adjustPosition('up')}
                    onDown={() => adjustPosition('down')}
                    onLeft={() => adjustPosition('left')}
                    onRight={() => adjustPosition('right')}
                    colorClass="hover:bg-cyan-800 active:bg-cyan-700"
                    centerColorClass="text-cyan-400"
                    btnSize={btnSize}
                    label="位置移動"
                    sublabel="X軸/Y軸方向に移動"
                    centerIcon={<Move className="w-4 h-4 text-cyan-400" />}
                />
                <DPad
                    onUp={() => adjustSize('up')}
                    onDown={() => adjustSize('down')}
                    onLeft={() => adjustSize('left')}
                    onRight={() => adjustSize('right')}
                    colorClass="hover:bg-amber-800 active:bg-amber-700"
                    centerColorClass="text-amber-400"
                    btnSize={btnSize}
                    label="サイズ調整"
                    sublabel="↑↓高さ  ←→幅"
                    centerIcon={<Maximize2 className="w-4 h-4 text-amber-400" />}
                />
            </div>

            {/* Coordinate display */}
            {selectedCrop && (
                <div className="flex justify-center gap-3 text-[11px] text-gray-500 font-mono">
                    <span>X: {(selectedCrop.box_2d[1] * 100).toFixed(1)}%</span>
                    <span>Y: {(selectedCrop.box_2d[0] * 100).toFixed(1)}%</span>
                    <span>W: {((selectedCrop.box_2d[3] - selectedCrop.box_2d[1]) * 100).toFixed(1)}%</span>
                    <span>H: {((selectedCrop.box_2d[2] - selectedCrop.box_2d[0]) * 100).toFixed(1)}%</span>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-xl transition-colors text-sm font-bold border border-gray-600"
                >
                    クリア
                </button>
                <button
                    onClick={onExecute}
                    disabled={isProcessing || crops.length === 0}
                    className="flex-2 flex items-center justify-center gap-2 px-6 py-3 bg-mint-600 hover:bg-mint-500 active:bg-mint-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl text-base font-bold shadow-lg shadow-mint-500/20 transition-colors"
                >
                    <Scissors className="w-5 h-5" />
                    分割実行
                </button>
            </div>
        </div>
    );
}
