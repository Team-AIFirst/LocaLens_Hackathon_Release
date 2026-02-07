import { useRef, useState, useEffect, useCallback, type RefObject } from "react";
import type { LocalizationIssue } from "../types";
import { ISSUE_TYPE_META } from "../types";

interface VisualOverlayProps {
  imageUrl?: string;
  videoUrl?: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
  issues: LocalizationIssue[];
  activeIssueId?: string | null;
  onIssueClick?: (issueId: string) => void;
}

interface MediaDims {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

const getSeverityColors = (severity: string, isActive: boolean) => {
  if (isActive) {
    return {
      fill: "rgba(234, 179, 8, 0.25)",
      stroke: "#eab308",
      labelBg: "#eab308",
    };
  }
  switch (severity) {
    case "HIGH":
      return {
        fill: "rgba(239, 68, 68, 0.15)",
        stroke: "#ef4444",
        labelBg: "#ef4444",
      };
    case "MEDIUM":
      return {
        fill: "rgba(250, 204, 21, 0.15)",
        stroke: "#facc15",
        labelBg: "#eab308",
      };
    case "LOW":
      return {
        fill: "rgba(34, 197, 94, 0.1)",
        stroke: "#22c55e",
        labelBg: "#22c55e",
      };
    default:
      return {
        fill: "rgba(255, 255, 255, 0.1)",
        stroke: "#fff",
        labelBg: "#fff",
      };
  }
};

export default function VisualOverlay({
  imageUrl,
  videoUrl,
  videoRef: externalVideoRef,
  issues,
  activeIssueId,
  onIssueClick,
}: VisualOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRefUsed = externalVideoRef ?? internalVideoRef;

  const [dims, setDims] = useState<MediaDims>({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  const calculateMediaDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let mediaWidth = 0;
    let mediaHeight = 0;

    if (videoUrl && videoRefUsed.current) {
      mediaWidth = videoRefUsed.current.videoWidth;
      mediaHeight = videoRefUsed.current.videoHeight;
    } else if (imgRef.current) {
      mediaWidth = imgRef.current.naturalWidth;
      mediaHeight = imgRef.current.naturalHeight;
    }

    if (!mediaWidth || !mediaHeight) return;

    const containerRatio = containerWidth / containerHeight;
    const mediaRatio = mediaWidth / mediaHeight;

    let displayedWidth: number;
    let displayedHeight: number;

    if (mediaRatio > containerRatio) {
      displayedWidth = containerWidth;
      displayedHeight = containerWidth / mediaRatio;
    } else {
      displayedHeight = containerHeight;
      displayedWidth = containerHeight * mediaRatio;
    }

    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;

    setDims({ width: displayedWidth, height: displayedHeight, offsetX, offsetY });
  }, [videoUrl, videoRefUsed]);

  useEffect(() => {
    calculateMediaDimensions();
    window.addEventListener("resize", calculateMediaDimensions);
    return () => window.removeEventListener("resize", calculateMediaDimensions);
  }, [calculateMediaDimensions]);

  // 타임스탬프 파싱 (M:SS 또는 M:SS.s 형식 지원)
  const parseTimestamp = (ts: string): number => {
    const parts = ts.split(":");
    const minutes = Number(parts[0]) || 0;
    const seconds = Number(parts[1]) || 0; // "15.5" -> 15.5
    return minutes * 60 + seconds;
  };

  // 안정적인 비디오 seek 함수
  const seekVideo = useCallback((video: HTMLVideoElement, targetTime: number) => {
    // 비디오가 충분히 로드되었는지 확인
    if (video.readyState < 2) {
      // HAVE_CURRENT_DATA 미만이면 로드 대기
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
    // 일시정지 후 seek (더 안정적)
    video.pause();
    
    // seeked 이벤트로 seek 완료 확인
    const handleSeeked = () => {
      video.removeEventListener("seeked", handleSeeked);
      // seek 완료 후 프레임 안정화를 위해 짧은 지연
      requestAnimationFrame(() => {
        video.pause();
      });
    };
    
    video.addEventListener("seeked", handleSeeked);
    video.currentTime = targetTime;
    
    // 타임아웃 안전장치 (1초 후에도 seeked가 안 오면 정리)
    setTimeout(() => {
      video.removeEventListener("seeked", handleSeeked);
    }, 1000);
  };

  // Video timestamp seek on active issue change
  useEffect(() => {
    if (!activeIssueId || !videoUrl || !videoRefUsed.current) return;
    const issue = issues.find((i) => i.id === activeIssueId);
    if (issue?.timestamp) {
      seekVideo(videoRefUsed.current, parseTimestamp(issue.timestamp));
    }
  }, [activeIssueId, issues, videoUrl, videoRefUsed, seekVideo]);

  const convertCoord = (x: number, y: number) => ({
    x: dims.offsetX + (x / 1000) * dims.width,
    y: dims.offsetY + (y / 1000) * dims.height,
  });

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-sm overflow-hidden bg-black border border-white/10"
    >
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-500/30 pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-500/30 pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-500/30 pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-500/30 pointer-events-none z-10" />

      {/* Media */}
      {videoUrl ? (
        <video
          ref={videoRefUsed as React.RefObject<HTMLVideoElement>}
          src={videoUrl}
          className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity duration-500"
          onLoadedMetadata={calculateMediaDimensions}
          controls
        />
      ) : imageUrl ? (
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Analysis target"
          className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity duration-500"
          onLoad={calculateMediaDimensions}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
          No media loaded
        </div>
      )}

      {/* Issue Count Badge */}
      {issues.length > 0 && (
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-sm border border-white/10 z-10">
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">
            {issues.length} Issue{issues.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* SVG Overlay */}
      {dims.width > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Filters */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* CSS Animation styles */}
          <style>
            {`
              @keyframes boxPulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
              }
              .bbox-pulse {
                animation: boxPulse 2s ease-in-out infinite;
              }
              @keyframes labelPulse {
                0%, 100% { opacity: 0.85; }
                50% { opacity: 1; }
              }
              .label-pulse {
                animation: labelPulse 2s ease-in-out infinite;
              }
            `}
          </style>

          {issues.map((issue) => {
            const isActive = issue.id === activeIssueId;
            const colors = getSeverityColors(issue.severity, isActive);
            const tl = convertCoord(issue.location.x1, issue.location.y1);
            const br = convertCoord(issue.location.x2, issue.location.y2);
            
            // 바운딩 박스 120% 확대 (중심 기준)
            const origW = br.x - tl.x;
            const origH = br.y - tl.y;
            const expandRatio = 0.1; // 10% 확장 (각 방향으로)
            const expandX = origW * expandRatio;
            const expandY = origH * expandRatio;
            const x = tl.x - expandX;
            const y = tl.y - expandY;
            const w = origW + expandX * 2;
            const h = origH + expandY * 2;
            
            if (w <= 0 || h <= 0) return null;

            const meta = ISSUE_TYPE_META[issue.type];
            // 외곽선 두께 60%로 축소
            const strokeWidth = isActive ? 2.4 : 1.2;
            const strokeDash = isActive ? "0" : "4,2";
            // 코너 마커 두께도 60%로 축소
            const cornerStrokeWidth = 1.8;
            const cornerLength = 10;

            return (
              <g key={issue.id} className="bbox-pulse">
                {/* Bounding box */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  rx={2}
                  className="pointer-events-auto cursor-pointer transition-all"
                  filter={isActive ? "url(#glow)" : undefined}
                  onClick={() => onIssueClick?.(issue.id)}
                />

                {/* Corner markers for active */}
                {isActive && (
                  <>
                    <line x1={x} y1={y} x2={x + cornerLength} y2={y} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x} y1={y} x2={x} y2={y + cornerLength} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x + w} y1={y} x2={x + w - cornerLength} y2={y} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x + w} y1={y} x2={x + w} y2={y + cornerLength} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x} y1={y + h} x2={x + cornerLength} y2={y + h} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x} y1={y + h} x2={x} y2={y + h - cornerLength} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x + w} y1={y + h} x2={x + w - cornerLength} y2={y + h} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                    <line x1={x + w} y1={y + h} x2={x + w} y2={y + h - cornerLength} stroke={colors.stroke} strokeWidth={cornerStrokeWidth} />
                  </>
                )}

                {/* Label - 스페이싱 축소 */}
                <foreignObject x={x} y={y - 18} width={Math.max(w, 140)} height={20}>
                  <div className="flex items-center gap-1 label-pulse">
                    {/* Severity dot - 크기 축소 */}
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: colors.stroke,
                        boxShadow: `0 0 4px ${colors.stroke}`,
                      }}
                    />
                    {/* Label tag - 패딩 축소 */}
                    <div
                      className="px-1.5 py-0.5 rounded-sm text-[8px] font-bold text-white whitespace-nowrap"
                      style={{ backgroundColor: colors.labelBg }}
                    >
                      {meta?.label || issue.type.replace(/_/g, " ")}
                      {issue.timestamp && (
                        <span className="ml-1 opacity-80 font-mono">[{issue.timestamp}]</span>
                      )}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
