import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
    isMobile: boolean;
}

export function LoadingSpinner({ isMobile }: LoadingSpinnerProps) {
    return (
        <div className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10",
            isMobile ? "rounded-3xl" : "rounded-2xl sm:rounded-lg"
        )}>
            <div className="text-center">
                <div className={cn(
                    "animate-spin border-mint-500 border-t-transparent rounded-full mx-auto",
                    isMobile
                        ? "w-16 h-16 border-4 mb-4"
                        : "w-12 h-12 border-2 mb-3"
                )} />
                <p className={cn(
                    "text-mint-400 font-bold animate-pulse",
                    isMobile ? "text-base" : "text-lg sm:text-xl font-medium"
                )}>
                    Geminiで解析中...
                </p>
            </div>
        </div>
    );
}
