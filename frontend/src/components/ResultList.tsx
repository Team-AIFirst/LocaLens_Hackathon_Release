import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LocalizationIssue, InputType, IssueSeverity, IssueType } from "../types";
import { ALL_ISSUE_TYPES, ISSUE_TYPE_META } from "../types";
import VisualOverlay from "./VisualOverlay";
import ResultCard from "./ResultCard";
import VideoTimeline from "./VideoTimeline";

interface ResultListProps {
  issues: LocalizationIssue[];
  filename: string;
  processingTime: number;
  analyzedFrames?: number;
  previewUrls?: Record<string, string>;
  inputType?: InputType;
  videoDuration?: number;
}

type SeverityFilter = "ALL" | IssueSeverity;
type TypeFilter = "ALL" | IssueType;

export default function ResultList({
  issues,
  filename,
  processingTime,
  analyzedFrames,
  previewUrls = {},
  inputType = "image",
  videoDuration,
}: ResultListProps) {
  const [sevFilter, setSevFilter] = useState<SeverityFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // 비디오 모드에서는 기본 OFF, 이미지 모드에서는 기본 ON
  const [showAllIssues, setShowAllIssues] = useState(inputType === "image");
  const [currentNavIndex, setCurrentNavIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 타임스탬프 파싱 (M:SS 또는 M:SS.s 형식 지원)
  const parseTimestamp = (ts: string): number => {
    const parts = ts.split(":");
    const minutes = Number(parts[0]) || 0;
    const seconds = Number(parts[1]) || 0; // "15.5" -> 15.5
    return minutes * 60 + seconds;
  };

  // 안정적인 비디오 seek 함수
  const seekVideo = useCallback((targetTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    // 비디오가 충분히 로드되었는지 확인
    if (video.readyState < 2) {
      // 로드 대기 후 seek
      const handleCanPlay = () => {
        video.removeEventListener("canplay", handleCanPlay);
        performSeek(video, targetTime);
      };
      video.addEventListener("canplay", handleCanPlay);
      return;
    }
    performSeek(video, targetTime);
  }, []);

  const performSeek = (video: HTMLVideoElement, targetTime: number) => {
    video.pause();
    
    const handleSeeked = () => {
      video.removeEventListener("seeked", handleSeeked);
      requestAnimationFrame(() => {
        video.pause();
      });
    };
    
    video.addEventListener("seeked", handleSeeked);
    video.currentTime = targetTime;
    
    // 타임아웃 안전장치
    setTimeout(() => {
      video.removeEventListener("seeked", handleSeeked);
    }, 1000);
  };

  // Issues with timestamps for video timeline
  const timedIssues = useMemo(
    () => issues.filter((i) => i.timestamp).sort((a, b) => {
      return parseTimestamp(a.timestamp!) - parseTimestamp(b.timestamp!);
    }),
    [issues]
  );

  // Active issue state - 첫 번째 타임드 이슈로 초기화
  const [activeIssueId, setActiveIssueId] = useState<string | null>(() => {
    if (inputType === "video" && timedIssues.length > 0) {
      return timedIssues[0].id;
    }
    return null;
  });

  // 비디오 모드에서 첫 번째 이슈 자동 선택 (issues 변경 시)
  useEffect(() => {
    if (inputType === "video" && timedIssues.length > 0 && !activeIssueId) {
      setActiveIssueId(timedIssues[0].id);
    }
  }, [inputType, timedIssues, activeIssueId]);

  // Unique files
  const fileNames = useMemo(() => {
    const set = new Set(issues.map((i) => i.frame_url).filter(Boolean) as string[]);
    return Array.from(set);
  }, [issues]);

  // Filtered issues
  const filtered = useMemo(() => {
    let list = issues;
    if (selectedFile) list = list.filter((i) => i.frame_url === selectedFile);
    if (sevFilter !== "ALL") list = list.filter((i) => i.severity === sevFilter);
    if (typeFilter !== "ALL") list = list.filter((i) => i.type === typeFilter);
    return list;
  }, [issues, selectedFile, sevFilter, typeFilter]);

  // Severity counts
  const sevCounts = useMemo(() => {
    const c = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    issues.forEach((i) => c[i.severity]++);
    return c;
  }, [issues]);

  // Current preview URL
  const currentPreviewUrl = selectedFile
    ? previewUrls[selectedFile]
    : fileNames[currentNavIndex]
    ? previewUrls[fileNames[currentNavIndex]]
    : Object.values(previewUrls)[0];

  const resetFilters = () => {
    setSevFilter("ALL");
    setTypeFilter("ALL");
  };

  const isFiltered = sevFilter !== "ALL" || typeFilter !== "ALL";

  const handleNavPrev = () => {
    setCurrentNavIndex((prev) => (prev > 0 ? prev - 1 : fileNames.length - 1));
  };

  const handleNavNext = () => {
    setCurrentNavIndex((prev) => (prev < fileNames.length - 1 ? prev + 1 : 0));
  };

  // 현재 선택된 이슈의 인덱스 (타임드 이슈 기준)
  const currentIssueIndex = useMemo(() => {
    if (!activeIssueId) return -1;
    return timedIssues.findIndex((i) => i.id === activeIssueId);
  }, [activeIssueId, timedIssues]);

  // 타임라인 네비게이션
  const handleTimelinePrev = () => {
    if (timedIssues.length === 0) return;
    const newIndex = currentIssueIndex > 0 ? currentIssueIndex - 1 : timedIssues.length - 1;
    const issue = timedIssues[newIndex];
    setActiveIssueId(issue.id);
    // 안정적인 비디오 시간 이동
    if (issue.timestamp) {
      seekVideo(parseTimestamp(issue.timestamp));
    }
  };

  const handleTimelineNext = () => {
    if (timedIssues.length === 0) return;
    const newIndex = currentIssueIndex < timedIssues.length - 1 ? currentIssueIndex + 1 : 0;
    const issue = timedIssues[newIndex];
    setActiveIssueId(issue.id);
    // 안정적인 비디오 시간 이동
    if (issue.timestamp) {
      seekVideo(parseTimestamp(issue.timestamp));
    }
  };

  // 현재 선택된 이미지 파일명
  const currentFileName = fileNames[currentNavIndex] || null;

  // 오버레이에 표시할 이슈들
  const overlayIssues = useMemo(() => {
    if (inputType === "image") {
      // 이미지 모드: 현재 선택된 이미지의 이슈만 표시
      if (fileNames.length > 1 && currentFileName) {
        return filtered.filter((i) => i.frame_url === currentFileName);
      }
      return filtered;
    }
    // 비디오 모드
    if (showAllIssues) {
      return filtered;
    }
    // 비디오 모드 + 체크박스 OFF: 선택된 이슈만
    return filtered.filter((i) => i.id === activeIssueId);
  }, [inputType, showAllIssues, filtered, activeIssueId, fileNames.length, currentFileName]);

  // 결과 카드에 표시할 이슈들
  const cardIssues = useMemo(() => {
    if (inputType === "image") {
      // 이미지 모드: 현재 선택된 이미지의 이슈만 표시
      if (fileNames.length > 1 && currentFileName) {
        return filtered.filter((i) => i.frame_url === currentFileName);
      }
      return filtered;
    }
    // 비디오 모드
    if (showAllIssues) {
      return filtered;
    }
    // 비디오 모드 + 체크박스 OFF: 선택된 이슈만
    return filtered.filter((i) => i.id === activeIssueId);
  }, [inputType, showAllIssues, filtered, activeIssueId, fileNames.length, currentFileName]);

  return (
    <section id="results-section" className="py-12 bg-graphite-950">
      <div className="container mx-auto px-6">
        {/* Summary Header */}
        <div className="bg-white/5 rounded-sm border border-white/5 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left - Title & Stats */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Analysis Summary
              </p>
              <h2 className="text-2xl font-bold text-white mb-4">
                {fileNames.length > 1
                  ? `${fileNames.length} Assets Analyzed`
                  : filename}
              </h2>
            </div>

            {/* Right - Time & Frames */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-right">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Time</p>
                <p className="font-mono text-white">{processingTime.toFixed(2)}s</p>
              </div>
              {analyzedFrames && (
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Frames</p>
                  <p className="font-mono text-white">{analyzedFrames}</p>
                </div>
              )}
            </div>
          </div>

          {/* Severity Summary */}
          <div className="border-t border-white/5 pt-6 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* HIGH */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-accent-red"
                    style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)" }}
                  />
                  <span className="text-sm text-gray-400">
                    <span className="text-accent-red">⚠</span> HIGH: {sevCounts.HIGH}
                  </span>
                </div>

                {/* MEDIUM */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-primary-500"
                    style={{ boxShadow: "0 0 8px rgba(234, 179, 8, 0.5)" }}
                  />
                  <span className="text-sm text-gray-400">
                    <span className="text-primary-500">⚡</span> MEDIUM: {sevCounts.MEDIUM}
                  </span>
                </div>

                {/* LOW */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-sm text-gray-400">
                    ℹ LOW: {sevCounts.LOW}
                  </span>
                </div>
              </div>

              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Total: {issues.length} Issues Detected
              </div>
            </div>
          </div>
        </div>

        {/* Options & Filters Row */}
        <div className="flex items-center justify-between mb-6 h-[42px]">
          {/* Left - Show All Issues Checkbox */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllIssues}
                onChange={(e) => setShowAllIssues(e.target.checked)}
                disabled={inputType === "image"}
                className={`w-4 h-4 rounded border-2 ${
                  showAllIssues
                    ? "bg-primary-500 border-primary-500"
                    : "border-gray-500 bg-transparent"
                } ${inputType === "image" ? "opacity-60" : ""}`}
              />
              <span className="text-[10px] text-gray-500">Show all issues on overlay</span>
            </label>
            <span className="text-[10px] text-gray-500">
              {inputType === "image"
                ? `${filtered.length} issues (image mode)`
                : showAllIssues
                ? `Showing ${filtered.length} issues`
                : "Showing selected issue only"}
            </span>
          </div>

          {/* Right - Filters */}
          <div className="flex items-center gap-2">
            {/* Severity Filter */}
            <select
              value={sevFilter}
              onChange={(e) => setSevFilter(e.target.value as SeverityFilter)}
              className="bg-black border border-white/10 rounded-sm px-2 py-1 text-[10px] font-bold text-gray-300 tracking-wider uppercase outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="bg-black border border-white/10 rounded-sm px-2 py-1 text-[10px] font-bold text-gray-300 tracking-wider uppercase outline-none"
            >
              <option value="ALL">All Types</option>
              {ALL_ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ISSUE_TYPE_META[t].label}
                </option>
              ))}
            </select>

            {/* Reset */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Main Grid - 12 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            {/* Video Timeline - 항상 전체 이슈 표시 */}
            {inputType === "video" && videoDuration ? (
              <VideoTimeline
                duration={videoDuration}
                issues={filtered}  /* 항상 전체 필터된 이슈 표시 */
                activeIssueId={activeIssueId}
                currentIndex={currentIssueIndex}
                totalCount={timedIssues.length}
                onIssueClick={(id) => {
                  setActiveIssueId(id);
                  // 클릭한 이슈의 시간으로 안정적인 비디오 이동
                  const issue = timedIssues.find((i) => i.id === id);
                  if (issue?.timestamp) {
                    seekVideo(parseTimestamp(issue.timestamp));
                  }
                }}
                onPrev={handleTimelinePrev}
                onNext={handleTimelineNext}
                onSeek={(ts) => {
                  if (videoRef.current) {
                    const parts = ts.split(":").map(Number);
                    const secs = (parts[0] || 0) * 60 + (parts[1] || 0);
                    videoRef.current.currentTime = secs;
                  }
                }}
                compact
              />
            ) : fileNames.length > 1 ? (
              /* Image Assets Navigator */
              <div className="bg-graphite-800 rounded-sm border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-600 tracking-[0.3em] uppercase">
                      Image Assets
                    </span>
                    {/* Navigation */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleNavPrev}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-[10px] font-mono text-gray-500">
                        {currentNavIndex + 1}/{fileNames.length}
                      </span>
                      <button
                        onClick={handleNavNext}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    {fileNames.length} images • {issues.length} total issues
                  </span>
                </div>

                {/* Image buttons */}
                <div className="p-2 flex gap-2 overflow-x-auto custom-scrollbar">
                  {fileNames.map((fn, idx) => {
                    const issueCount = issues.filter((i) => i.frame_url === fn).length;
                    const isSelected = currentNavIndex === idx;

                    return (
                      <button
                        key={fn}
                        onClick={() => setCurrentNavIndex(idx)}
                        className={`
                          flex-shrink-0 px-3 py-2 rounded-sm text-[10px] font-bold tracking-wider uppercase border transition-all
                          ${isSelected
                            ? "bg-primary-500 text-graphite-900 border-primary-500"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                          }
                        `}
                      >
                        {fn.length > 20 ? `${fn.slice(0, 17)}...` : fn}
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded text-[8px] ${
                            isSelected ? "bg-graphite-900/30" : "bg-white/10"
                          }`}
                        >
                          {issueCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Visual Overlay */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 tracking-[0.3em] uppercase mb-2">
                Visual Inspection
              </p>
              <VisualOverlay
                imageUrl={inputType === "image" ? currentPreviewUrl : undefined}
                videoUrl={inputType === "video" ? currentPreviewUrl : undefined}
                videoRef={videoRef}
                issues={overlayIssues}
                activeIssueId={activeIssueId}
                onIssueClick={(id) => setActiveIssueId(id === activeIssueId ? null : id)}
              />
            </div>

            {/* Tip */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-sm">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="font-bold">Tip:</span> Click on bounding boxes to view issue details.
              </p>
            </div>
          </div>

          {/* Right Column - 5 cols */}
          <div className="lg:col-span-5">
            <div className="max-h-[800px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {cardIssues.map((issue, idx) => (
                  <ResultCard
                    key={issue.id}
                    issue={issue}
                    index={idx}
                    isActive={issue.id === activeIssueId}
                    onClick={() =>
                      setActiveIssueId(issue.id === activeIssueId ? null : issue.id)
                    }
                    onHover={() => setActiveIssueId(issue.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {cardIssues.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-2">No matches found</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Try adjusting your filters to see more results.
                  </p>
                  {isFiltered && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-primary-400 hover:text-primary-300"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
