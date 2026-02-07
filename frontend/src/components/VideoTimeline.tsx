import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LocalizationIssue } from "../types";
import { ISSUE_TYPE_META } from "../types";

interface VideoTimelineProps {
  duration: number;
  issues: LocalizationIssue[];
  activeIssueId?: string | null;
  currentIndex?: number;  // 외부에서 전달된 현재 인덱스
  totalCount?: number;    // 전체 타임드 이슈 수
  onIssueClick?: (issueId: string) => void;
  onPrev?: () => void;    // 외부 네비게이션 핸들러
  onNext?: () => void;    // 외부 네비게이션 핸들러
  onSeek?: (timestamp: string) => void;
  compact?: boolean;
}

const severityColor: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#eab308",
  LOW: "#6b7280",
};

// 타임스탬프 파싱 (M:SS 또는 M:SS.s 형식 지원)
function parseTimestamp(ts: string): number {
  const parts = ts.split(":");
  const minutes = Number(parts[0]) || 0;
  const seconds = Number(parts[1]) || 0; // "15.5" -> 15.5
  return minutes * 60 + seconds;
}

// 시간 포맷팅 (소수점 1자리까지 표시)
function formatTime(seconds: number, showDecimal: boolean = false): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (showDecimal) {
    return `${m}:${s.toFixed(1).padStart(4, "0")}`;
  }
  return `${m}:${String(Math.floor(s)).padStart(2, "0")}`;
}

export default function VideoTimeline({
  duration,
  issues,
  activeIssueId,
  currentIndex: externalIndex,
  totalCount: externalTotal,
  onIssueClick,
  onPrev,
  onNext,
  onSeek,
  compact = false,
}: VideoTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [internalNavIndex, setInternalNavIndex] = useState(0);

  const timedIssues = useMemo(
    () => issues.filter((i) => i.timestamp).sort((a, b) => {
      return parseTimestamp(a.timestamp!) - parseTimestamp(b.timestamp!);
    }),
    [issues]
  );

  // 동일 타임스탬프 이슈 그룹화 및 오프셋 계산
  const issueOffsets = useMemo(() => {
    const offsetMap: Record<string, number> = {};
    const timestampGroups: Record<string, string[]> = {};
    
    // 같은 타임스탬프끼리 그룹화
    timedIssues.forEach((issue) => {
      const ts = issue.timestamp!;
      if (!timestampGroups[ts]) {
        timestampGroups[ts] = [];
      }
      timestampGroups[ts].push(issue.id);
    });
    
    // 각 이슈에 오프셋 할당 (같은 타임스탬프 내에서 순서대로)
    Object.values(timestampGroups).forEach((ids) => {
      ids.forEach((id, idx) => {
        offsetMap[id] = idx;
      });
    });
    
    return offsetMap;
  }, [timedIssues]);

  // 동일 타임스탬프 이슈가 있는지 확인 (최대 그룹 크기)
  const maxStackCount = useMemo(() => {
    const timestampCounts: Record<string, number> = {};
    timedIssues.forEach((issue) => {
      const ts = issue.timestamp!;
      timestampCounts[ts] = (timestampCounts[ts] || 0) + 1;
    });
    return Math.max(1, ...Object.values(timestampCounts));
  }, [timedIssues]);

  // 외부 인덱스 사용 가능하면 외부 것 사용
  const currentNavIndex = externalIndex !== undefined ? externalIndex : internalNavIndex;
  const totalIssues = externalTotal !== undefined ? externalTotal : timedIssues.length;

  // Time ticks
  const ticks = useMemo(() => {
    const arr: number[] = [];
    const step = duration <= 300 ? 30 : 60; // 30s for <= 5min, else 60s
    for (let t = 0; t <= duration; t += step) arr.push(t);
    return arr;
  }, [duration]);

  const handleNavPrev = () => {
    if (onPrev) {
      onPrev();
      return;
    }
    // 내부 네비게이션 (fallback)
    if (timedIssues.length === 0) return;
    const newIndex = internalNavIndex > 0 ? internalNavIndex - 1 : timedIssues.length - 1;
    setInternalNavIndex(newIndex);
    const issue = timedIssues[newIndex];
    if (issue) {
      onIssueClick?.(issue.id);
      if (issue.timestamp) onSeek?.(issue.timestamp);
    }
  };

  const handleNavNext = () => {
    if (onNext) {
      onNext();
      return;
    }
    // 내부 네비게이션 (fallback)
    if (timedIssues.length === 0) return;
    const newIndex = internalNavIndex < timedIssues.length - 1 ? internalNavIndex + 1 : 0;
    setInternalNavIndex(newIndex);
    const issue = timedIssues[newIndex];
    if (issue) {
      onIssueClick?.(issue.id);
      if (issue.timestamp) onSeek?.(issue.timestamp);
    }
  };

  // 이슈가 없어도 타임라인 표시 (빈 상태)

  // 동일 타임스탬프 이슈가 있으면 트랙 높이 증가
  const baseTrackHeight = compact ? 24 : 48; // px
  const markerSizePx = compact ? 12 : 16; // px
  const stackOffset = markerSizePx * 0.6; // 60% 겹침 (40% 보임)
  const extraHeight = maxStackCount > 1 ? (maxStackCount - 1) * stackOffset : 0;
  const trackHeightPx = baseTrackHeight + extraHeight;
  
  const markerSize = compact ? "w-3 h-3" : "w-4 h-4";
  const legendDotSize = compact ? "w-2 h-2" : "w-3 h-3";
  const textSize = compact ? "text-[8px]" : "text-[9px]";

  // 이슈 인덱스 표시 텍스트 (0/0 또는 1/n)
  const indexDisplay = totalIssues === 0 
    ? "0/0" 
    : `${currentNavIndex + 1}/${totalIssues}`;

  return (
    <div className={`rounded-sm bg-graphite-800 border border-white/10 ${compact ? "p-2" : "p-4"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-gray-600 tracking-[0.3em] uppercase">
            Video Timeline
          </span>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleNavPrev}
              disabled={totalIssues === 0}
              className={`p-1 rounded transition-colors ${
                totalIssues === 0 
                  ? "text-gray-700 cursor-not-allowed" 
                  : "text-gray-500 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-[10px] font-mono text-gray-500 min-w-[40px] text-center">
              {indexDisplay}
            </span>
            <button
              onClick={handleNavNext}
              disabled={totalIssues === 0}
              className={`p-1 rounded transition-colors ${
                totalIssues === 0 
                  ? "text-gray-700 cursor-not-allowed" 
                  : "text-gray-500 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <span className="text-[10px] font-mono text-gray-500">
          {timedIssues.length} issues • {formatTime(duration)} total
        </span>
      </div>

      {/* Time Markers */}
      <div className="relative px-2">
        <div className="flex justify-between mb-1">
          {ticks.map((t) => (
            <span key={t} className={`${textSize} font-mono text-gray-600`}>
              {formatTime(t)}
            </span>
          ))}
        </div>
      </div>

      {/* Track */}
      <div 
        className="relative bg-graphite-900 rounded-sm overflow-visible"
        style={{ height: `${trackHeightPx}px` }}
      >
        {/* Grid lines */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full w-px bg-white/5"
            style={{ left: `${(t / duration) * 100}%` }}
          />
        ))}

        {/* Issue markers */}
        {timedIssues.map((issue) => {
          const secs = parseTimestamp(issue.timestamp!);
          const pct = (secs / duration) * 100;
          const isActive = issue.id === activeIssueId;
          const isHovered = issue.id === hoveredId;
          const color = severityColor[issue.severity] || "#6b7280";
          
          // 동일 타임스탬프 이슈에 대한 수직 오프셋
          const offsetIndex = issueOffsets[issue.id] || 0;
          const verticalOffset = offsetIndex * stackOffset;

          return (
            <div
              key={issue.id}
              className="absolute z-10"
              style={{ 
                left: `${pct}%`,
                top: `${baseTrackHeight / 2 + verticalOffset}px`,
                transform: 'translateY(-50%)',
                zIndex: isActive || isHovered ? 20 : 10 - offsetIndex, // 활성/호버 시 위로
              }}
              onMouseEnter={() => setHoveredId(issue.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.button
                whileHover={{ scale: 1.5 }}
                onClick={() => {
                  onIssueClick?.(issue.id);
                  // 외부 핸들러가 없는 경우에만 내부 상태 업데이트
                  if (!onPrev && !onNext) {
                    const idx = timedIssues.findIndex((i) => i.id === issue.id);
                    if (idx !== -1) setInternalNavIndex(idx);
                    onSeek?.(issue.timestamp!);
                  }
                }}
                className={`relative -translate-x-1/2 ${markerSize} rounded-full cursor-pointer transition-all`}
                style={{
                  backgroundColor: color,
                  boxShadow: isActive ? `0 0 12px ${color}` : "none",
                  border: isActive ? `2px solid white` : "none",
                }}
              >
                {/* HIGH severity pulse (normal mode only) */}
                {!compact && issue.severity === "HIGH" && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-50"
                    style={{ backgroundColor: color }}
                  />
                )}
              </motion.button>

              {/* Tooltip */}
              <AnimatePresence>
                {(isHovered || isActive) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[180px] p-2 rounded-sm bg-graphite-900 border border-white/10 text-xs z-50"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span>{ISSUE_TYPE_META[issue.type]?.icon}</span>
                      <span className="font-medium text-white">{ISSUE_TYPE_META[issue.type]?.label}</span>
                    </div>
                    <p className="text-gray-400 line-clamp-2">{issue.description}</p>
                    <span className="text-gray-500 font-mono mt-1 block">@ {issue.timestamp}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex items-center justify-between border-t border-white/5 ${compact ? "mt-2 pt-2" : "mt-3 pt-3"}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className={`${legendDotSize} rounded-full`}
              style={{ backgroundColor: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.5)" }}
            />
            <span className={`${textSize} text-gray-500`}>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`${legendDotSize} rounded-full`}
              style={{ backgroundColor: "#eab308", boxShadow: "0 0 6px rgba(234,179,8,0.5)" }}
            />
            <span className={`${textSize} text-gray-500`}>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`${legendDotSize} rounded-full bg-gray-500`} />
            <span className={`${textSize} text-gray-500`}>Low</span>
          </div>
        </div>

        <span className={`${textSize} text-gray-600`}>Click marker to jump</span>
      </div>
    </div>
  );
}
