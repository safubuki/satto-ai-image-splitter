import { cn } from '../../lib/utils';

interface ErrorDisplayProps {
    error: string | null;
    isMobile: boolean;
}

export function ErrorDisplay({ error, isMobile }: ErrorDisplayProps) {
    if (!error) return null;

    return (
        <div className={cn(
            "bg-red-950/50 border border-red-900/50 text-red-200",
            isMobile
                ? "p-4 rounded-2xl text-sm"
                : "p-4 sm:p-6 rounded-xl text-base sm:text-lg"
        )}>
            Error: {error}
        </div>
    );
}
