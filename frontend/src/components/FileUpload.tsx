import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { InputType } from "../types";

interface FileUploadProps {
  inputType: InputType;
  onFilesSelected: (files: File[]) => void;
  onInputTypeChange?: (type: InputType) => void;
  disabled?: boolean;
}

const ACCEPT_MAP: Record<InputType, string> = {
  image: ".png,.jpg,.jpeg,.webp",
  video: ".mp4,.mov,.webm",
};

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export default function FileUpload({
  inputType,
  onFilesSelected,
  onInputTypeChange,
  disabled,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (files: File[]): InputType | "mixed" | null => {
    if (files.length === 0) return null;

    const hasImages = files.some((f) => IMAGE_TYPES.includes(f.type));
    const hasVideos = files.some((f) => VIDEO_TYPES.includes(f.type));

    if (hasImages && hasVideos) return "mixed";
    if (hasImages) return "image";
    if (hasVideos) return "video";
    return null;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      setError(null);

      const arr = Array.from(files);
      const detectedType = detectFileType(arr);

      // Handle mixed types
      if (detectedType === "mixed") {
        setError("Please upload either images or a video, not both.");
        return;
      }

      // Use detected type for validation (fallback to current inputType)
      const effectiveType = detectedType || inputType;

      // Validate video: only one file allowed
      if (effectiveType === "video" && arr.length > 1) {
        setError("Video analysis supports only one video file at a time.");
        return;
      }

      // Size validation based on detected file type
      const maxSize = effectiveType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      const oversized = arr.find((f) => f.size > maxSize);
      if (oversized) {
        setError(
          effectiveType === "video"
            ? "Video file must be under 100MB."
            : "Each image must be under 10MB."
        );
        return;
      }

      // Auto-switch input type based on dropped files (after validation passes)
      if (detectedType && detectedType !== inputType && onInputTypeChange) {
        onInputTypeChange(detectedType);
      }

      onFilesSelected(arr);
    },
    [inputType, onFilesSelected, onInputTypeChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {/* Dropzone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? "border-primary-500 bg-primary-500/10"
            : "border-graphite-600 hover:border-graphite-500 bg-graphite-700/30 hover:bg-graphite-700/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[inputType]}
          multiple={inputType === "image"}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          {/* Icon Container */}
          <div
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-colors
              ${isDragging ? "bg-primary-500/20" : "bg-graphite-600"}
            `}
          >
            {inputType === "image" ? (
              <svg
                className={`w-6 h-6 transition-colors ${isDragging ? "text-primary-500" : "text-graphite-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg
                className={`w-6 h-6 transition-colors ${isDragging ? "text-primary-500" : "text-graphite-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-white">
            {inputType === "image"
              ? "Drop images here or click to upload"
              : "Drop video here or click to upload"}
          </p>

          {/* Supported formats */}
          <p className="text-xs text-graphite-400">
            {inputType === "image"
              ? "PNG, JPG, WebP (max 10MB each)"
              : "MP4, MOV, WebM (max 100MB, 10 minutes)"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2"
          >
            <svg
              className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
