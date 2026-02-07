import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
  isAnalyzing?: boolean;
  progress?: number;
  files?: File[];
  previewUrls?: Record<string, string>;
  onRemoveFile?: (fileName: string) => void;
  onClearAll?: () => void;
}

// Concentric Hexagons background component
function ConcentricHexagons({ isAnalyzing }: { isAnalyzing?: boolean }) {
  const scales = [1, 0.85, 0.7, 0.55, 0.4, 0.25];
  const opacities = [0.15, 0.12, 0.09, 0.06, 0.04, 0.03];

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${isAnalyzing ? 'opacity-100' : 'opacity-40'}`}>
      <div className="relative w-[600px] h-[600px] animate-spin-slow">
        {scales.map((scale, i) => (
          <svg
            key={i}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            style={{
              transform: `scale(${scale}) rotate(${i * 5}deg)`,
              opacity: opacities[i],
            }}
          >
            <polygon
              points="50 5, 90 27.5, 90 72.5, 50 95, 10 72.5, 10 27.5"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </svg>
        ))}
        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[200px] h-[200px] rounded-full bg-gradient-radial from-white/10 to-transparent blur-xl" />
        </div>
      </div>
    </div>
  );
}

// File list item component
function FileListItem({
  file,
  previewUrl,
  thumbnailScale,
  onRemove,
}: {
  file: File;
  previewUrl?: string;
  thumbnailScale: number;
  onRemove: () => void;
}) {
  const isVideo = file.type.startsWith("video/");
  const thumbnailSize = 48 * thumbnailScale;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="group flex items-center gap-3 p-2 rounded-lg bg-graphite-700/30 hover:bg-graphite-700/50 transition-colors">
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 rounded-lg bg-graphite-600 overflow-hidden relative"
        style={{ width: thumbnailSize, height: thumbnailSize }}
      >
        {previewUrl && (
          isVideo ? (
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          )
        )}
        {isVideo && (
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-black/70 rounded flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.name}</p>
        <p className="text-xs text-graphite-400">{formatFileSize(file.size)}</p>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/10 text-graphite-400 hover:text-red-400 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Hero({
  children,
  isAnalyzing,
  progress,
  files = [],
  previewUrls = {},
  onRemoveFile,
  onClearAll,
}: HeroProps) {
  const [thumbnailScale, setThumbnailScale] = useState(1);
  const hasFiles = files.length > 0;

  return (
    <>
      {/* Announcement Banner - Fixed below navbar */}
      <div className="fixed top-[68px] left-0 right-0 z-40 bg-primary-500 py-2 text-center">
        <p className="text-sm font-medium text-graphite-900">
          Meet LocaLens Agent — your collaborative AI reviewer, built right into your workflow.{" "}
          <Link to="/features" className="underline hover:no-underline">
            Read more →
          </Link>
        </p>
      </div>

      {/* Main Hero Section */}
      <section
        id="analyzer"
        className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-12 bg-graphite-900"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hexagon opacity-50 pointer-events-none" />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-graphite-900 via-transparent to-graphite-900 opacity-60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite-900 via-transparent to-graphite-900 opacity-40 pointer-events-none" />

        {/* Concentric Hexagons */}
        <ConcentricHexagons isAnalyzing={isAnalyzing} />

        {/* Content Container */}
        <div className="relative z-10 w-full container mx-auto px-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              <span className="text-white">The next generation</span>{" "}
              <span className="text-graphite-400">of localization QA.</span>
            </h1>
            <p className="text-sm text-graphite-400 whitespace-nowrap">
              Detect UI issues in game screenshots and videos with AI-powered precision
            </p>
          </motion.div>

          {/* Main Panel Container - Dynamic Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto transition-all duration-500 relative"
            style={{ maxWidth: hasFiles ? 900 : 512 }}
          >
            {/* Scanning Overlay - covers both panels */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-2xl"
              >
                {/* Scan line with glow */}
                <div className="absolute inset-x-0 animate-scan-line">
                  <div className="h-0.5 bg-cyan-400" />
                  <div className="h-32 bg-gradient-to-b from-cyan-400/30 to-transparent" />
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                {/* Progress indicator - centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    {/* Progress circle */}
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="6"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${(progress || 0) * 2.83} 283`}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-cyan-400 font-mono">
                          {Math.min(Math.round(progress || 0), 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Status text */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-sm border border-cyan-400/30">
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
                        AI Analyzing
                      </span>
                    </div>
                  </div>
                </div>

                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50" />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-graphite-900/60 -z-10" />
              </motion.div>
            )}

            <div
              className={`flex gap-6 transition-all duration-300 ${
                isAnalyzing ? "scale-[1.01]" : "scale-100"
              }`}
            >
              {/* Left Panel - Input Area */}
              <motion.div
                className={`
                  bg-graphite-800/90 backdrop-blur-xl rounded-2xl border border-graphite-700 p-5 shadow-2xl
                  animate-slide-up animation-delay-100
                  ${hasFiles ? "w-[512px] flex-shrink-0" : "w-full"}
                `}
              >
                {children}
              </motion.div>

              {/* Right Panel - File List (only when files exist) */}
              {hasFiles && onRemoveFile && onClearAll && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 min-w-[280px] max-h-[470px] bg-graphite-800/90 backdrop-blur-xl rounded-2xl border border-graphite-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up animation-delay-200"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-graphite-700/50 border-b border-graphite-700">
                    <h3 className="text-sm font-semibold text-white">
                      Selected ({files.length})
                    </h3>

                    {/* Thumbnail Size Slider */}
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-graphite-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.2"
                        value={thumbnailScale}
                        onChange={(e) => setThumbnailScale(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-graphite-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                      <span className="text-[10px] text-graphite-500 w-8">
                        {Math.round(thumbnailScale * 100)}%
                      </span>
                    </div>

                    {/* Clear All */}
                    <button
                      onClick={onClearAll}
                      className="text-xs text-graphite-400 hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* File List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {files.map((file) => (
                      <FileListItem
                        key={file.name}
                        file={file}
                        previewUrl={previewUrls[file.name]}
                        thumbnailScale={thumbnailScale}
                        onRemove={() => onRemoveFile(file.name)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
