import { useState, useEffect } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageUploader } from './components/ImageUploader';
import { ImageOverlay } from './components/ImageOverlay';
import { ResultGallery } from './components/ResultGallery';
import { analyzeImage, type AnalyzeResponse } from './lib/geminiSplitter';
import { processImageCrops, fileToBase64, type CropResult } from './lib/imageProcessor';
import { saveHistory } from './lib/db';
import { Settings } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('gemini_model') || 'gemini-2.5-flash-lite');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [cropResults, setCropResults] = useState<CropResult[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-4 h-28 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-mint-500/20 blur-lg rounded-full group-hover:bg-mint-500/30 transition-all duration-500" />
              <img src="icon.png" alt="Logo" className="w-14 h-14 md:w-10 md:h-10 relative z-10 object-contain drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xs md:text-[10px] font-bold tracking-[0.2em] text-mint-500 uppercase leading-none mb-1">
                AI-POWERED EASY IMAGE SPLITTER
              </span>
              <h1 className="text-3xl md:text-xl font-bold text-white tracking-wide leading-none mb-1">
                サッとAIイメージ分割
              </h1>
              <p className="text-sm md:text-[11px] text-gray-400 leading-tight opacity-80">
                画像や漫画のコマをAIで自動検出。画像をそれぞれ簡単に分割保存。
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="p-4 md:p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="API Settings"
          >
            <Settings className="w-8 h-8 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <ApiKeyModal
          isOpen={isKeyModalOpen}
          onSave={handleSaveKey}
          onClear={handleClearKey}
          onClose={() => setIsKeyModalOpen(false)}
          initialKey={apiKey}
          initialModel={model}
        />

        {!originalImage ? (
          <div className="py-12">
            <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />

            {!apiKey && (
              <div
                onClick={() => setIsKeyModalOpen(true)}
                className="mt-6 mx-auto max-w-xl p-6 md:p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4 md:gap-3 cursor-pointer hover:bg-red-500/20 transition-all group animate-bounce-subtle"
              >
                <div className="p-4 md:p-2 bg-red-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Settings className="w-7 h-7 md:w-5 md:h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-400 text-lg md:text-sm">⚠️ APIキーが設定されていません</h3>
                  <p className="text-base md:text-xs text-red-300/80">ここをクリックして、Google Gemini APIキーを設定してください。</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl md:text-lg font-medium text-gray-300">解析結果</h2>
            </div>

            {error && (
              <div className="p-6 md:p-4 bg-red-950/50 border border-red-900/50 text-red-200 rounded-lg text-lg md:text-sm">
                Error: {error}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Left: Visualization */}
              <div className="space-y-4">
                <p className="text-xl md:text-base text-gray-500 font-mono uppercase tracking-wider">元画像 / 解析オーバーレイ</p>
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900/50">
                  <ImageOverlay imageSrc={originalImage} analysisData={analysisData} />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 md:w-8 md:h-8 border-2 border-mint-500 border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-mint-400 font-medium animate-pulse text-xl md:text-base">Geminiで解析中...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-10 py-4 md:px-6 md:py-2.5 text-lg md:text-sm font-bold text-white bg-gray-800 border border-gray-700 rounded-full shadow-lg transition-all hover:bg-gray-750 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 group"
                    title="Clear and start over"
                  >
                    <span className="group-hover:text-red-100 transition-colors">Clear & New</span>
                  </button>
                </div>
              </div>

              {/* Right: Results */}
              <div className="space-y-4">
                <p className="text-xl md:text-base text-gray-500 font-mono uppercase tracking-wider">分割された画像</p>
                {cropResults.length > 0 ? (
                  <ResultGallery results={cropResults} />
                ) : (
                  <div className="h-full min-h-[400px] border-2 border-gray-800 border-dashed rounded-xl flex items-center justify-center text-gray-600 text-2xl md:text-lg">
                    {isProcessing ? "解析結果を待っています..." : "まだ結果がありません"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-gray-900 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Powered by Google Gemini</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
