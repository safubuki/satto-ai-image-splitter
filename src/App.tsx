import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageUploader } from './components/ImageUploader';
import { analyzeImage, type AnalyzeResponse, type SplitResult } from './lib/geminiSplitter';
import { processImageCrops, fileToBase64, type CropResult } from './lib/imageProcessor';
import { saveHistory } from './lib/db';
import { useMobile } from './hooks/useMobile';
import { cn } from './lib/utils';
import { RotateCcw, Download, Settings, Play, Edit3, Hand } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileResultLayout } from './components/layouts/MobileResultLayout';
import { DesktopResultLayout } from './components/layouts/DesktopResultLayout';
import { RectangleEditor } from './components/RectangleEditor';
import { RectangleControls } from './components/RectangleControls';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorDisplay } from './components/ui/ErrorDisplay';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('gemini_model') || 'gemini-2.5-flash-lite');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editableCrops, setEditableCrops] = useState<SplitResult[]>([]);
  const [selectedCropIndex, setSelectedCropIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [adjustStep, setAdjustStep] = useState(0.02);
  const [cropResults, setCropResults] = useState<CropResult[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive current phase
  const phase = (() => {
    if (!originalImage) return 'upload' as const;
    if (isProcessing && !isEditMode) return 'analyzing' as const;
    if (isProcessing && isEditMode) return 'cropping' as const;
    if (isEditMode) return 'editing' as const;
    if (cropResults.length > 0) return 'results' as const;
    return 'preview' as const;
  })();

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

  // Step 1: Load image (don't auto-analyze)
  const handleImageSelect = async (file: File) => {
    setError(null);
    setEditableCrops([]);
    setCropResults([]);
    setIsEditMode(false);

    try {
      const base64 = await fileToBase64(file);
      setOriginalFile(file);
      setOriginalImage(base64);
    } catch (e) {
      console.error(e);
      setError("画像の読み込みに失敗しました。");
    }
  };

  // Step 2: User clicks "解析開始"
  const handleStartAnalysis = async () => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }
    if (!originalImage || !originalFile) return;

    setIsProcessing(true);
    setIsEditMode(false);
    setError(null);

    try {
      const data = await analyzeImage(originalImage, apiKey, model);
      setEditableCrops(data.crops.map(c => ({ ...c, box_2d: [...c.box_2d] as [number, number, number, number] })));
      setSelectedCropIndex(0);
      setIsEditMode(true);
    } catch (e: any) {
      console.error("Analysis error:", e);
      setError(e.message || "解析に失敗しました。もう一度お試しください。");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: Update a crop's coordinates during editing
  const handleUpdateCrop = useCallback((index: number, newBox: [number, number, number, number]) => {
    setEditableCrops(prev => prev.map((crop, i) =>
      i === index ? { ...crop, box_2d: newBox } : crop
    ));
  }, []);

  // Delete a crop from the list
  const handleDeleteCrop = useCallback((index: number) => {
    setEditableCrops(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setSelectedCropIndex(prev => prev >= editableCrops.length - 1 ? Math.max(0, prev - 1) : prev);
  }, [editableCrops.length]);

  // Add a new crop rectangle
  const handleAddCrop = useCallback(() => {
    const newCrop: SplitResult = {
      label: `manual ${editableCrops.length + 1}`,
      box_2d: [0.1, 0.1, 0.5, 0.5],
    };
    setEditableCrops(prev => [...prev, newCrop]);
    setSelectedCropIndex(editableCrops.length);
  }, [editableCrops.length]);

  // Step 4: Execute crop with adjusted rectangles
  const handleExecuteCrop = async () => {
    if (!originalFile || editableCrops.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const editedAnalysis: AnalyzeResponse = { crops: editableCrops };
      const results = await processImageCrops(originalFile, editedAnalysis);
      setCropResults(results);
      setIsEditMode(false);
      saveHistory(originalFile.name, results).catch(console.error);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "分割に失敗しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  // Go back to editing mode from results
  const handleReEdit = () => {
    setCropResults([]);
    setIsEditMode(true);
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalImage(null);
    setEditableCrops([]);
    setCropResults([]);
    setIsEditMode(false);
    setError(null);
  };

  const previewActionButtonBase =
    "w-full flex min-h-[104px] flex-col items-center justify-center gap-2.5 rounded-[1.75rem] px-3 py-4 text-center font-bold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:flex-row sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3";
  const previewActionIconBase = "h-6 w-6 shrink-0 sm:h-5 sm:w-5";
  const previewActionLabelBase =
    "whitespace-nowrap text-[clamp(0.82rem,3.8vw,0.95rem)] leading-tight tracking-[0.02em] sm:text-base";

  return (
    <div className={cn(
      "min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans",
      isMobile && phase === 'results' && "pb-20"
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
          isMobile={isMobile}
        />

        {/* Phase: Upload */}
        {phase === 'upload' && (
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
        )}

        {/* Phase: Preview (image loaded, waiting for start) */}
        {phase === 'preview' && originalImage && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ErrorDisplay error={error} isMobile={isMobile} />
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">画像プレビュー</h2>
              <p className="text-sm text-gray-500">AI解析、または手動で矩形を指定して分割できます</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl sm:rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-xl">
                <img src={originalImage} alt="Preview" className="w-full h-auto block" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:flex sm:justify-center sm:gap-4">
              <button
                onClick={handleReset}
                className={cn(
                  previewActionButtonBase,
                  "border border-gray-600 bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600"
                )}
              >
                <RotateCcw className={previewActionIconBase} />
                <span className={previewActionLabelBase}>キャンセル</span>
              </button>
              <button
                onClick={() => {
                  setEditableCrops([{ label: 'manual 1', box_2d: [0.05, 0.05, 0.95, 0.95] }]);
                  setSelectedCropIndex(0);
                  setIsEditMode(true);
                }}
                className={cn(
                  previewActionButtonBase,
                  "border border-amber-500/40 bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600"
                )}
              >
                <Hand className={cn(previewActionIconBase, "text-amber-400")} />
                <span className={previewActionLabelBase}>手動モード</span>
              </button>
              <button
                onClick={handleStartAnalysis}
                className={cn(
                  previewActionButtonBase,
                  "border border-mint-400/20 bg-mint-600 text-white shadow-lg shadow-mint-500/20 hover:bg-mint-500 active:bg-mint-700 sm:px-8"
                )}
              >
                <Play className={previewActionIconBase} />
                <span className="whitespace-nowrap text-[clamp(0.92rem,4vw,1.05rem)] leading-tight tracking-[0.02em] sm:text-lg">
                  AI解析
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Phase: Analyzing (loading overlay on image) */}
        {phase === 'analyzing' && originalImage && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-2xl sm:rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-xl">
                <img src={originalImage} alt="Analyzing" className="w-full h-auto block opacity-50" />
                <LoadingSpinner isMobile={isMobile} />
              </div>
            </div>
          </div>
        )}

        {/* Phase: Editing (rectangle adjustment) */}
        {(phase === 'editing' || phase === 'cropping') && originalImage && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">矩形調整</h2>
                <p className="text-sm text-gray-500 mt-1">矩形をドラッグまたはD-padで調整してください</p>
              </div>
            </div>

            <ErrorDisplay error={error} isMobile={isMobile} />

            <div className={cn(
              "grid gap-4 sm:gap-6 items-end",
              isMobile ? "grid-cols-1" : "grid-cols-[1fr_360px]"
            )}>
              <div className="relative">
                <RectangleEditor
                  imageSrc={originalImage}
                  crops={editableCrops}
                  selectedIndex={selectedCropIndex}
                  onSelectCrop={setSelectedCropIndex}
                  onUpdateCrop={handleUpdateCrop}
                  isMobile={isMobile}
                />
                {phase === 'cropping' && <LoadingSpinner isMobile={isMobile} />}
              </div>
              <RectangleControls
                crops={editableCrops}
                selectedIndex={selectedCropIndex}
                onSelectCrop={setSelectedCropIndex}
                onUpdateCrop={handleUpdateCrop}
                onDeleteCrop={handleDeleteCrop}
                onAddCrop={handleAddCrop}
                onExecute={handleExecuteCrop}
                onReset={handleReset}
                step={adjustStep}
                onStepChange={setAdjustStep}
                isMobile={isMobile}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}

        {/* Phase: Results */}
        {phase === 'results' && originalImage && (
          isMobile ? (
            <MobileResultLayout
              error={error}
              originalImage={originalImage}
              analysisData={{ crops: editableCrops }}
              isProcessing={isProcessing}
              cropResults={cropResults}
              onReEdit={handleReEdit}
            />
          ) : (
            <DesktopResultLayout
              error={error}
              originalImage={originalImage}
              analysisData={{ crops: editableCrops }}
              isProcessing={isProcessing}
              cropResults={cropResults}
              onReset={handleReset}
              onReEdit={handleReEdit}
            />
          )
        )}
      </main>

      <Footer isMobile={isMobile} originalImage={originalImage} />

      {/* Mobile: Fixed bottom action bar when viewing results */}
      {isMobile && phase === 'results' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-50 pb-safe">
          <div className="flex items-center justify-around px-4 py-3 gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-xl transition-colors text-base font-bold"
            >
              <RotateCcw className="w-5 h-5" />
              <span>クリア</span>
            </button>
            <button
              onClick={handleReEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-xl transition-colors text-base font-bold border border-yellow-500/30"
            >
              <Edit3 className="w-5 h-5 text-yellow-400" />
              <span>矩形調整</span>
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
              className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-3 bg-mint-600 hover:bg-mint-500 active:bg-mint-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl transition-colors text-base font-bold shadow-lg shadow-mint-500/20"
            >
              <Download className="w-5 h-5" />
              <span>全DL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
