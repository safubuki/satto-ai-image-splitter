import { useState, useEffect, useRef } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageUploader } from './components/ImageUploader';
import { analyzeImage, type AnalyzeResponse } from './lib/geminiSplitter';
import { processImageCrops, fileToBase64, type CropResult } from './lib/imageProcessor';
import { saveHistory } from './lib/db';
import { useMobile } from './hooks/useMobile';
import { cn } from './lib/utils';
import { RotateCcw, Download, Settings } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileResultLayout } from './components/layouts/MobileResultLayout';
import { DesktopResultLayout } from './components/layouts/DesktopResultLayout';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('gemini_model') || 'gemini-2.5-flash-lite');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [cropResults, setCropResults] = useState<CropResult[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile detection with resize listener
  const isMobile = useMobile();
  // Reference for file input (for mobile bottom action bar)
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
    }
  }, [apiKey]);

  const handleSaveKey = (key: string, newModel: string) => {
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', newModel);
    setApiKey(key);
    setModel(newModel);
    setIsKeyModalOpen(false);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsKeyModalOpen(false);
  };

  const handleImageSelect = async (file: File) => {
    setError(null);
    setAnalysisData(null);
    setCropResults([]);

    try {
      const base64 = await fileToBase64(file);
      setOriginalImage(base64);

      handleAnalyze(file, base64);
    } catch (e) {
      console.error(e);
      setError("画像の読み込みに失敗しました。");
    }
  };

  const handleAnalyze = async (file: File, base64: string) => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Analyze with Gemini
      const data = await analyzeImage(base64, apiKey, model);
      setAnalysisData(data);

      // 2. Crop images
      const results = await processImageCrops(file, data);
      setCropResults(results);

      // 3. Save specific history (fire and forget)
      saveHistory(file.name, results).catch(console.error);

    } catch (e: any) {
      console.error(e);
      const msg = e.message || "";
      if (msg.includes("429") || msg.includes("quota")) {
        setError("API制限(Quota)を超えました。しばらく待ってから再度お試しください。");
      } else {
        setError(msg || "解析に失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setAnalysisData(null);
    setCropResults([]);
    setError(null);
  };

  return (
    <div className={cn(
      "min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans",
      isMobile && originalImage && "pb-20"
    )}>
      {/* Hidden file input for mobile bottom action bar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
        }}
        accept="image/*"
        className="hidden"
      />

      <Header isMobile={isMobile} onOpenSettings={() => setIsKeyModalOpen(true)} />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <ApiKeyModal
          isOpen={isKeyModalOpen}
          onSave={handleSaveKey}
          onClear={handleClearKey}
          onClose={() => setIsKeyModalOpen(false)}
          initialKey={apiKey}
          initialModel={model}
        />

        {!originalImage ? (
          <div className="py-4 sm:py-12">
            <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} isMobile={isMobile} />

            {!apiKey && (
              <div
                onClick={() => setIsKeyModalOpen(true)}
                className="mt-6 sm:mt-6 mx-auto max-w-xl p-5 sm:p-6 bg-red-500/10 border border-red-500/30 rounded-2xl sm:rounded-xl flex items-center gap-4 sm:gap-4 cursor-pointer hover:bg-red-500/20 active:bg-red-500/30 transition-all group animate-bounce-subtle"
              >
                <div className="p-4 sm:p-4 bg-red-500/20 rounded-xl sm:rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <Settings className="w-7 h-7 sm:w-7 sm:h-7 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-red-400 text-lg sm:text-lg">⚠️ APIキーが未設定</h3>
                  <p className="text-base sm:text-base text-red-300/80">タップしてAPIキーを設定</p>
                </div>
              </div>
            )}
          </div>
        ) : isMobile ? (
          <MobileResultLayout
            error={error}
            originalImage={originalImage}
            analysisData={analysisData}
            isProcessing={isProcessing}
            cropResults={cropResults}
          />
        ) : (
          <DesktopResultLayout
            error={error}
            originalImage={originalImage}
            analysisData={analysisData}
            isProcessing={isProcessing}
            cropResults={cropResults}
            onReset={handleReset}
          />
        )}
      </main>

      <Footer isMobile={isMobile} originalImage={originalImage} />

      {/* Mobile: Fixed bottom action bar when viewing results */}
      {isMobile && originalImage && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-50 pb-safe">
          <div className="flex items-center justify-around px-4 py-5 gap-4">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-4 px-8 py-7 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-2xl transition-colors text-3xl font-bold"
            >
              <RotateCcw className="w-10 h-10" />
              <span>クリア</span>
            </button>
            <button
              onClick={() => {
                cropResults.forEach((crop, i) => {
                  setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = crop.url;
                    link.download = `${crop.label.replace(/\s+/g, '_')}_${crop.id.slice(0, 4)}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }, i * 300);
                });
              }}
              disabled={cropResults.length === 0}
              className="flex-[1.5] flex items-center justify-center gap-4 px-8 py-7 bg-mint-600 hover:bg-mint-500 active:bg-mint-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-2xl transition-colors text-3xl font-bold shadow-lg shadow-mint-500/20"
            >
              <Download className="w-10 h-10" />
              <span>全てダウンロード</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
