import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    isProcessing: boolean;
    isMobile?: boolean;
}

export function ImageUploader({ onImageSelect, isProcessing, isMobile = false }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files?.[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onImageSelect(file);
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative w-full max-w-2xl mx-auto border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center group",
                isMobile
                    ? "min-h-[80vh] p-10 rounded-3xl"
                    : "aspect-video p-8 md:p-12 rounded-2xl",
                isDragging
                    ? "border-mint-500 bg-mint-900/10 scale-[1.02]"
                    : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900 active:bg-gray-800",
                isProcessing && "pointer-events-none opacity-50"
            )}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                    if (e.target.files?.[0]) onImageSelect(e.target.files[0]);
                }}
                accept="image/*"
                className="hidden"
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-mint-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {isProcessing ? (
                <div className={cn(
                    "flex flex-col items-center text-mint-500 animate-pulse",
                    isMobile ? "gap-5" : "gap-4"
                )}>
                    <Loader2 className={cn(
                        "animate-spin",
                        isMobile ? "w-16 h-16" : "w-16 h-16"
                    )} />
                    <p className={cn(
                        "font-bold",
                        isMobile ? "text-xl" : "text-xl"
                    )}>画像を処理中...</p>
                </div>
            ) : (
                <div className={cn(
                    "text-center relative z-10 w-full px-4",
                    isMobile ? "space-y-8" : "space-y-6"
                )}>
                    <div className={cn(
                        "bg-gray-800 rounded-full flex items-center justify-center mx-auto group-hover:bg-gray-700 transition-colors shadow-lg shadow-black/20",
                        isMobile ? "w-24 h-24" : "w-20 h-20"
                    )}>
                        {isDragging ? (
                            <Upload
                                className="text-mint-500"
                                style={isMobile ? { width: 48, height: 48 } : { width: 40, height: 40 }}
                            />
                        ) : (
                            <ImageIcon
                                className="text-gray-500 group-hover:text-gray-300"
                                style={isMobile ? { width: 48, height: 48 } : { width: 40, height: 40 }}
                            />
                        )}
                    </div>
                    <div>
                        <h3 className={cn(
                            "font-bold text-white",
                            isMobile ? "text-3xl mb-5" : "text-2xl mb-3"
                        )}>
                            {isDragging ? "ドロップしてアップロード" : "画像をアップロード"}
                        </h3>
                        <p className={cn(
                            "text-gray-400 max-w-md mx-auto leading-relaxed",
                            isMobile ? "text-xl" : "text-base"
                        )}>
                            タップして画像を選択
                            {!isMobile && <span>、またはドラッグ＆ドロップ</span>}
                            <br />
                            <span className={cn(
                                "text-gray-500 block",
                                isMobile ? "text-base mt-3" : "text-sm mt-2"
                            )}>(JPG, PNG, WEBP)</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
