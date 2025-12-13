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
                ? "p-6 rounded-2xl text-3xl"
                : "p-4 sm:p-6 rounded-xl text-base sm:text-lg"
        )}>
            Error: {error}
        </div>
    );
}
