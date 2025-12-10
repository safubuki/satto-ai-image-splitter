import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    isProcessing: boolean;
}

export function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
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
                "relative w-full aspect-video max-w-2xl mx-auto rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 group",
                isDragging
                    ? "border-mint-500 bg-mint-900/10 scale-[1.02]"
                    : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900",
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

            <div className="absolute inset-0 bg-gradient-to-tr from-mint-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {isProcessing ? (
                <div className="flex flex-col items-center gap-4 text-mint-500 animate-pulse">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="text-lg font-medium">画像を処理中...</p>
                </div>
            ) : (
                <div className="text-center space-y-4 relative z-10">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto group-hover:bg-gray-700 transition-colors">
                        {isDragging ? (
                            <Upload className="w-10 h-10 text-mint-500" />
                        ) : (
                            <ImageIcon className="w-10 h-10 text-gray-500 group-hover:text-gray-300" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {isDragging ? "ドロップしてアップロード" : "画像をアップロード"}
                        </h3>
                        <p className="text-gray-400 max-w-sm mx-auto">
                            分割したい画像をここにドラッグ＆ドロップ、またはクリックして選択。
                            (推奨: JPG, PNG, WEBP)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
