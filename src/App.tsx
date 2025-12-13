import { useState, useEffect, useRef } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageUploader } from './components/ImageUploader';
import { ImageOverlay } from './components/ImageOverlay';
import { ResultGallery } from './components/ResultGallery';
import { analyzeImage, type AnalyzeResponse } from './lib/geminiSplitter';
import { processImageCrops, fileToBase64, type CropResult } from './lib/imageProcessor';
import { saveHistory } from './lib/db';
import { useMobile } from './hooks/useMobile';
import { cn } from './lib/utils';
import { Settings, RotateCcw, Download } from 'lucide-react';

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
    // keep model preference or clear it? User didn't specify, but clearing key is main goal.
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

      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className={cn(
          "container mx-auto px-4 flex items-center justify-between gap-4",
          isMobile ? "py-6" : "h-20"
        )}>
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="relative group flex-shrink-0">
              <div className="absolute inset-0 bg-mint-500/20 blur-lg rounded-full group-hover:bg-mint-500/30 transition-all duration-500" />
              <img
                src="icon.png"
                alt="Logo"
                className={cn(
                  "relative z-10 object-contain drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] group-hover:scale-110 transition-transform duration-300",
                  isMobile ? "w-24 h-24" : "w-10 h-10"
                )}
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className={cn(
                "font-bold tracking-[0.15em] text-mint-500 uppercase leading-none mb-2",
                isMobile ? "text-xl" : "text-[10px]"
              )}>
                AI IMAGE SPLITTER
              </span>
              <h1 className={cn(
                "font-bold text-white tracking-wide leading-none",
                isMobile ? "text-5xl" : "text-xl"
              )}>
                サッとAIイメージ分割
              </h1>
              {!isMobile && (
                <p className="text-[11px] text-gray-400 leading-tight opacity-80 mt-1">
                  画像や漫画のコマをAIで自動検出
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={cn(
              "hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex-shrink-0 active:bg-gray-700",
              isMobile ? "p-5 rounded-2xl" : "p-2 rounded-lg"
            )}
            title="API Settings"
          >
            <Settings className={isMobile ? "w-14 h-14" : "w-6 h-6"} />
          </button>
        </div>
      </header>

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
          /* Mobile: 1-column layout */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
              <div className="p-6 bg-red-950/50 border border-red-900/50 text-red-200 rounded-2xl text-3xl">
                Error: {error}
              </div>
            )}

            {/* Mobile: Single column - Original image first */}
            <div className="space-y-4">
              <div>
                <h3 className="text-5xl font-bold text-white mb-2">解析結果</h3>
                <p className="text-2xl text-gray-500">元画像 / 解析オーバーレイ</p>
              </div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900/50">
                <ImageOverlay imageSrc={originalImage} analysisData={analysisData} />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
                    <div className="text-center">
                      <div className="animate-spin w-24 h-24 border-4 border-mint-500 border-t-transparent rounded-full mx-auto mb-6" />
                      <p className="text-mint-400 font-bold animate-pulse text-4xl">Geminiで解析中...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Results section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-5xl font-bold text-white mb-2">分割画像 ({cropResults.length})</h3>
                <p className="text-2xl text-gray-500">分割された画像</p>
              </div>
              {cropResults.length > 0 ? (
                <ResultGallery results={cropResults} isMobile={true} />
              ) : (
                <div className="min-h-[250px] border-2 border-gray-800 border-dashed rounded-3xl flex items-center justify-center text-gray-600 text-4xl">
                  {isProcessing ? "解析結果を待っています..." : "まだ結果がありません"}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop: 2-column layout */
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-300">解析結果</h2>
            </div>

            {error && (
              <div className="p-4 sm:p-6 bg-red-950/50 border border-red-900/50 text-red-200 rounded-xl text-base sm:text-lg">
                Error: {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Left: Visualization */}
              <div className="space-y-4 sm:space-y-4">
                <p className="text-base sm:text-xl text-gray-500 font-mono uppercase tracking-wider">元画像 / 解析オーバーレイ</p>
                <div className="relative rounded-2xl sm:rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900/50">
                  <ImageOverlay imageSrc={originalImage} analysisData={analysisData} />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl sm:rounded-lg z-10">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 sm:w-12 sm:h-12 border-2 border-mint-500 border-t-transparent rounded-full mx-auto mb-3" />
                        <p className="text-mint-400 font-medium animate-pulse text-lg sm:text-xl">Geminiで解析中...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 text-base sm:text-lg font-bold text-white bg-gray-800 border border-gray-700 rounded-full shadow-lg transition-all hover:bg-gray-750 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 active:bg-gray-700 group"
                    title="Clear and start over"
                  >
                    <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" />
                    <span className="group-hover:text-red-100 transition-colors">Clear & New</span>
                  </button>
                </div>
              </div>

              {/* Right: Results */}
              <div className="space-y-4 sm:space-y-4">
                <p className="text-base sm:text-xl text-gray-500 font-mono uppercase tracking-wider">分割された画像</p>
                {cropResults.length > 0 ? (
                  <ResultGallery results={cropResults} isMobile={false} />
                ) : (
                  <div className="h-full min-h-[250px] sm:min-h-[400px] border-2 border-gray-800 border-dashed rounded-2xl sm:rounded-xl flex items-center justify-center text-gray-600 text-lg sm:text-2xl">
                    {isProcessing ? "解析結果を待っています..." : "まだ結果がありません"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Desktop footer - hidden on mobile when showing results */}
      {(!isMobile || !originalImage) && (
        <footer className="py-6 border-t border-gray-900 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
            <p>Powered by Google Gemini</p>
          </div>
        </footer>
      )}

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
