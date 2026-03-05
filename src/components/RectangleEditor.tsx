import { useState, useRef, useEffect, useCallback } from 'react';
import { type SplitResult } from '../lib/geminiSplitter';

interface RectangleEditorProps {
    imageSrc: string;
    crops: SplitResult[];
    selectedIndex: number;
    onSelectCrop: (index: number) => void;
    onUpdateCrop: (index: number, newBox: [number, number, number, number]) => void;
    isMobile: boolean;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'move';

interface DragState {
    cropIndex: number;
    handleType: HandleType;
    startX: number;
    startY: number;
    startBox: [number, number, number, number];
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

const MIN_SIZE = 0.02;

const CURSOR_MAP: Record<HandleType, string> = {
    nw: 'nwse-resize', ne: 'nesw-resize',
    sw: 'nesw-resize', se: 'nwse-resize',
    n: 'ns-resize', s: 'ns-resize',
    w: 'ew-resize', e: 'ew-resize',
    move: 'move',
};

export function RectangleEditor({
    imageSrc, crops, selectedIndex, onSelectCrop, onUpdateCrop, isMobile
}: RectangleEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);

    const handlePointerDown = useCallback((
        e: React.PointerEvent,
        cropIndex: number,
        handleType: HandleType
    ) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectCrop(cropIndex);

        setDragState({
            cropIndex,
            handleType,
            startX: e.clientX,
            startY: e.clientY,
            startBox: [...crops[cropIndex].box_2d] as [number, number, number, number]
        });
    }, [crops, onSelectCrop]);

    useEffect(() => {
        if (!dragState) return;
        const container = containerRef.current;
        if (!container) return;

        const handleMove = (e: PointerEvent) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const deltaX = (e.clientX - dragState.startX) / rect.width;
            const deltaY = (e.clientY - dragState.startY) / rect.height;

            const [ymin, xmin, ymax, xmax] = dragState.startBox;
            let newBox: [number, number, number, number];

            switch (dragState.handleType) {
                case 'move': {
                    const w = xmax - xmin, h = ymax - ymin;
                    const nx = clamp(xmin + deltaX, 0, 1 - w);
                    const ny = clamp(ymin + deltaY, 0, 1 - h);
                    newBox = [ny, nx, ny + h, nx + w];
                    break;
                }
                case 'nw':
                    newBox = [clamp(ymin + deltaY, 0, ymax - MIN_SIZE), clamp(xmin + deltaX, 0, xmax - MIN_SIZE), ymax, xmax];
                    break;
                case 'ne':
                    newBox = [clamp(ymin + deltaY, 0, ymax - MIN_SIZE), xmin, ymax, clamp(xmax + deltaX, xmin + MIN_SIZE, 1)];
                    break;
                case 'sw':
                    newBox = [ymin, clamp(xmin + deltaX, 0, xmax - MIN_SIZE), clamp(ymax + deltaY, ymin + MIN_SIZE, 1), xmax];
                    break;
                case 'se':
                    newBox = [ymin, xmin, clamp(ymax + deltaY, ymin + MIN_SIZE, 1), clamp(xmax + deltaX, xmin + MIN_SIZE, 1)];
                    break;
                case 'n':
                    newBox = [clamp(ymin + deltaY, 0, ymax - MIN_SIZE), xmin, ymax, xmax];
                    break;
                case 's':
                    newBox = [ymin, xmin, clamp(ymax + deltaY, ymin + MIN_SIZE, 1), xmax];
                    break;
                case 'w':
                    newBox = [ymin, clamp(xmin + deltaX, 0, xmax - MIN_SIZE), ymax, xmax];
                    break;
                case 'e':
                    newBox = [ymin, xmin, ymax, clamp(xmax + deltaX, xmin + MIN_SIZE, 1)];
                    break;
                default:
                    return;
            }

            onUpdateCrop(dragState.cropIndex, newBox);
        };

        const handleUp = () => setDragState(null);

        window.addEventListener('pointermove', handleMove, { passive: false });
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        };
    }, [dragState, onUpdateCrop]);

    const handleSize = isMobile ? 24 : 14;
    const handleOffset = -handleSize / 2;

    const renderHandle = (
        cropIndex: number,
        handleType: HandleType,
        posStyle: React.CSSProperties
    ) => (
        <div
            key={handleType}
            className="absolute bg-yellow-400 border-2 border-yellow-600 rounded-full z-30 hover:scale-125 transition-transform"
            style={{
                width: handleSize,
                height: handleSize,
                cursor: CURSOR_MAP[handleType],
                ...posStyle,
            }}
            onPointerDown={(e) => handlePointerDown(e, cropIndex, handleType)}
        />
    );

    return (
        <div
            ref={containerRef}
            className="relative w-full rounded-2xl sm:rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-xl select-none"
            style={{ touchAction: dragState ? 'none' : 'auto' }}
        >
            <img
                src={imageSrc}
                alt="Original"
                className="w-full h-auto block pointer-events-none"
                draggable={false}
            />

            {crops.map((crop, i) => {
                const [ymin, xmin, ymax, xmax] = crop.box_2d;
                const top = ymin * 100;
                const left = xmin * 100;
                const width = (xmax - xmin) * 100;
                const height = (ymax - ymin) * 100;
                const isSelected = i === selectedIndex;

                return (
                    <div
                        key={i}
                        className={`absolute transition-colors ${
                            isSelected
                                ? 'border-2 border-yellow-400 bg-yellow-400/10 z-20'
                                : 'border-2 border-mint-500 bg-mint-500/10 hover:bg-mint-500/20 z-10'
                        }`}
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                            cursor: isSelected ? 'move' : 'pointer',
                            touchAction: 'none',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, i, isSelected ? 'move' : 'move')}
                    >
                        {/* Label */}
                        <div className={`absolute top-0 left-0 text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
                            isSelected ? 'bg-yellow-400 text-black' : 'bg-mint-500 text-black'
                        }`}>
                            {i + 1}. {crop.label}
                        </div>

                        {/* Resize handles for selected rectangle */}
                        {isSelected && (
                            <>
                                {/* Corner handles */}
                                {renderHandle(i, 'nw', { top: handleOffset, left: handleOffset })}
                                {renderHandle(i, 'ne', { top: handleOffset, right: handleOffset })}
                                {renderHandle(i, 'sw', { bottom: handleOffset, left: handleOffset })}
                                {renderHandle(i, 'se', { bottom: handleOffset, right: handleOffset })}
                                {/* Edge handles */}
                                {renderHandle(i, 'n', { top: handleOffset, left: '50%', transform: 'translateX(-50%)' })}
                                {renderHandle(i, 's', { bottom: handleOffset, left: '50%', transform: 'translateX(-50%)' })}
                                {renderHandle(i, 'w', { top: '50%', left: handleOffset, transform: 'translateY(-50%)' })}
                                {renderHandle(i, 'e', { top: '50%', right: handleOffset, transform: 'translateY(-50%)' })}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
