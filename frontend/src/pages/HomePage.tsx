import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIProvider, InputType, LocalizationIssue } from "../types";

import Hero from "../components/landing/Hero";
import FileUpload from "../components/FileUpload";
import ProviderSelect from "../components/ProviderSelect";
import ResultList from "../components/ResultList";
import ExportButton from "../components/ExportButton";
import { useAnalyze } from "../hooks/useAnalyze";

// 타임스탬프 파싱 (M:SS 또는 M:SS.s 형식 지원)
function parseTimestamp(ts: string): number {
  const parts = ts.split(":");
  const minutes = Number(parts[0]) || 0;
  const seconds = Number(parts[1]) || 0; // "15.5" -> 15.5
  return minutes * 60 + seconds;
}

function estimateVideoDuration(issues: LocalizationIssue[]): number {
  let maxSeconds = 0;
  issues.forEach((issue) => {
    if (issue.timestamp) {
      const totalSecs = parseTimestamp(issue.timestamp);
      if (totalSecs > maxSeconds) maxSeconds = totalSecs;
    }
  });
  return Math.max(maxSeconds + 30, 60);
}

export default function HomePage() {
  const [inputType, setInputType] = useState<InputType>("image");
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);

  const { loading, error, result, analyze, reset } = useAnalyze();

  // Use ref to track URLs for cleanup on unmount only
  const previewUrlsRef = useRef<Record<string, string>>({});
  previewUrlsRef.current = previewUrls;

  // Cleanup preview URLs on unmount only
  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  // Progress simulation
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return 95;
        return p + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [loading]);

  const handleInputTypeChange = useCallback(
    (type: InputType) => {
      setInputType(type);
      setFiles([]);
      setPreviewUrls({});
      reset();
      // Claude doesn't support video
      if (type === "video" && provider === "claude") {
        setProvider("gemini");
      }
    },
    [provider, reset]
  );

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    // Create preview URLs
    const urls: Record<string, string> = {};
    selected.forEach((f) => {
      urls[f.name] = URL.createObjectURL(f);
    });
    setPreviewUrls((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL);
      return urls;
    });
  }, []);

  const handleAnalyze = useCallback(() => {
    if (files.length === 0) return;
    analyze(files, provider, inputType);
  }, [files, provider, inputType, analyze]);

  const handleNewAnalysis = useCallback(() => {
    setFiles([]);
    setPreviewUrls((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL);
      return {};
    });
    reset();
  }, [reset]);

  const handleRemoveFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setPreviewUrls((prev) => {
      if (prev[fileName]) {
        URL.revokeObjectURL(prev[fileName]);
      }
      const newUrls = { ...prev };
      delete newUrls[fileName];
      return newUrls;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setPreviewUrls((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL);
      return {};
    });
  }, []);

  // Flatten all issues
  const allIssues = useMemo(
    () => result?.results.flatMap((r) => r.issues) ?? [],
    [result]
  );

  const videoDuration = useMemo(
    () => (inputType === "video" ? estimateVideoDuration(allIssues) : undefined),
    [inputType, allIssues]
  );

  return (
    <>
      <Hero 
        isAnalyzing={loading} 
        progress={Math.round(progress)}
        files={files}
        previewUrls={previewUrls}
        onRemoveFile={handleRemoveFile}
        onClearAll={handleClearAll}
      >
        {!result ? (
          /* ─── Analysis Form ─── */
          <div className="w-full space-y-4">
            {/* Input type tabs */}
            <div className="flex rounded-lg bg-graphite-700/50 p-1">
              {(["image", "video"] as InputType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleInputTypeChange(t)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all
                    ${inputType === t 
                      ? "bg-graphite-600 text-white shadow-sm" 
                      : "text-graphite-400 hover:text-white hover:bg-graphite-700/50"
                    }
                  `}
                >
                  {t === "image" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span>{t === "image" ? "Images" : "Video"}</span>
                </button>
              ))}
            </div>

            {/* File upload */}
            <FileUpload
              inputType={inputType}
              onFilesSelected={handleFilesSelected}
              onInputTypeChange={handleInputTypeChange}
              disabled={loading}
            />

            {/* Provider select */}
            <ProviderSelect
              selectedProvider={provider}
              inputType={inputType}
              onProviderChange={setProvider}
              disabled={loading}
            />

            {/* Analyze button */}
            <div className="relative">
              <motion.button
                whileHover={files.length > 0 && !loading ? { scale: 1.01 } : {}}
                whileTap={files.length > 0 && !loading ? { scale: 0.99 } : {}}
                onClick={handleAnalyze}
                disabled={files.length === 0 || loading}
                className={`
                  relative w-full py-3 rounded-lg font-semibold text-sm transition-all overflow-hidden
                  ${
                    files.length > 0 && !loading
                      ? "bg-primary-500 hover:bg-primary-400 text-graphite-900 shadow-glow-yellow"
                      : "bg-graphite-700 text-graphite-500 cursor-not-allowed"
                  }
                `}
              >
                {loading && (
                  <div 
                    className="absolute inset-0 bg-primary-600 transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing... {Math.min(Math.round(progress), 100)}%
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </span>
              </motion.button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2"
                >
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ─── Result Summary ─── */
          <div className="w-full text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h3 className="text-xl font-bold text-white">
              Analysis Complete — {result.total_issues} Issues Found
            </h3>
            <p className="text-sm text-graphite-400">
              {result.provider} · {result.input_type} · {result.processing_time.toFixed(2)}s
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="#results-section"
                className="px-5 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-400 text-graphite-900 text-sm font-semibold transition-colors"
              >
                View detailed report →
              </a>
              <ExportButton issues={allIssues} filename={files[0]?.name?.replace(/\.[^.]+$/, "")} />
              <button
                onClick={handleNewAnalysis}
                className="px-5 py-2.5 rounded-lg bg-graphite-700 hover:bg-graphite-600 text-white text-sm transition-colors border border-graphite-600"
              >
                New Analysis
              </button>
            </div>
          </div>
        )}
      </Hero>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResultList
              issues={allIssues}
              filename={files.length === 1 ? files[0].name : `${files.length} files`}
              processingTime={result.processing_time}
              analyzedFrames={result.analyzed_frames}
              previewUrls={previewUrls}
              inputType={inputType}
              videoDuration={videoDuration}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
