interface FooterProps {
    isMobile: boolean;
    originalImage: string | null;
}

export function Footer({ isMobile, originalImage }: FooterProps) {
    if (isMobile && originalImage) return null;

    return (
        <footer className="py-6 border-t border-gray-900 mt-12">
            <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
                <p>Powered by Google Gemini</p>
            </div>
        </footer>
    );
}
