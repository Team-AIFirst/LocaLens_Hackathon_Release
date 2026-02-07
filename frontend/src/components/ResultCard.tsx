import { useState } from "react";
import { motion } from "framer-motion";
import type { LocalizationIssue } from "../types";
import { ISSUE_TYPE_META } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface ResultCardProps {
  issue: LocalizationIssue;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
  onHover?: () => void;
}

const TEXT_ISSUE_TYPES = ["TEXT_TRUNCATION", "TEXT_OVERFLOW", "TEXT_SCALING"];

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "HIGH":
      return {
        borderColor: "border-accent-red/20",
        dotColor: "bg-accent-red",
        icon: "⚠",
        label: "HIGH",
        badgeBg: "bg-white/5",
        badgeText: "text-accent-red",
      };
    case "MEDIUM":
      return {
        borderColor: "border-primary-500/20",
        dotColor: "bg-primary-500",
        icon: "⚡",
        label: "MEDIUM",
        badgeBg: "bg-white/5",
        badgeText: "text-primary-500",
      };
    case "LOW":
      return {
        borderColor: "border-gray-500/20",
        dotColor: "bg-gray-500",
        icon: "ℹ",
        label: "LOW",
        badgeBg: "bg-white/5",
        badgeText: "text-gray-400",
      };
    default:
      return {
        borderColor: "border-white/10",
        dotColor: "bg-gray-500",
        icon: "•",
        label: severity,
        badgeBg: "bg-white/5",
        badgeText: "text-gray-400",
      };
  }
};

export default function ResultCard({ issue, index, isActive, onClick, onHover }: ResultCardProps) {
  const [alternatives, setAlternatives] = useState<string[]>(issue.alternative_texts || []);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const typeMeta = ISSUE_TYPE_META[issue.type];
  const sevStyles = getSeverityStyles(issue.severity);

  const fetchAlternatives = async () => {
    setLoadingAlts(true);
    try {
      const res = await fetch(`${API_BASE}/generate-alternatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_text: issue.original_text || issue.description,
          language: issue.language,
        }),
      });
      const data = await res.json();
      if (data.alternatives) setAlternatives(data.alternatives);
    } catch {
      setAlternatives(["대체 문장 생성 실패"]);
    } finally {
      setLoadingAlts(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.1,
      }}
      aria-label={`Issue ${index + 1}: ${typeMeta?.label}`}
      onClick={onClick}
      onMouseEnter={onHover}
      tabIndex={0}
      className={`
        rounded-sm p-6 border bg-white/5 transition-all duration-200 cursor-pointer
        ${sevStyles.borderColor}
        ${isActive
          ? "ring-2 ring-primary-500 ring-offset-4 ring-offset-black shadow-lg shadow-primary-500/20"
          : "hover:bg-white/[0.07]"
        }
      `}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3 mb-4">
        {/* Icon */}
        <div className={`p-2 rounded-sm bg-white/5 ${sevStyles.badgeText}`}>
          {typeMeta?.icon ? (
            <span className="text-lg">{typeMeta.icon}</span>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-gray-600">
              #{String(index + 1).padStart(3, "0")}
            </span>
            <span className="text-sm font-bold text-white tracking-wide uppercase">
              {typeMeta?.label || issue.type.replace(/_/g, " ")}
            </span>
            {/* Severity Badge */}
            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${sevStyles.badgeBg} ${sevStyles.badgeText}`}>
              {sevStyles.icon} {sevStyles.label}
            </span>
          </div>

          {/* Timestamp */}
          {issue.timestamp && (
            <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-gray-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {issue.timestamp}
            </div>
          )}
        </div>
      </div>

      {/* Description - Highlighted */}
      <div className="p-4 mb-4 bg-white/5 border-l-4 border-primary-500 rounded-r-sm">
        <p className="text-base text-white font-medium leading-relaxed">
          {issue.description}
        </p>
      </div>

      {/* Details Row */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {/* Language Tag */}
        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 uppercase">
          {issue.language}
        </span>

        {/* Location */}
        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-500">
          bbox: [{issue.location.x1},{issue.location.y1}]→[{issue.location.x2},{issue.location.y2}]
        </span>
      </div>

      {/* AI Suggestion */}
      <div className="p-3 rounded-sm bg-primary-500/5 border border-primary-500/10">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
          </svg>
          <span className="text-[10px] font-bold text-primary-500 tracking-wider uppercase">
            AI Suggestion
          </span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed italic">
          "{issue.suggestion}"
        </p>
      </div>

      {/* Alternative Texts Section */}
      {TEXT_ISSUE_TYPES.includes(issue.type) && (
        <div className="mt-4 p-4 rounded-sm bg-amber-500/5 border border-amber-500/20">
          {/* 버튼 상태 - 아직 생성 안됨 */}
          {alternatives.length === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchAlternatives();
              }}
              disabled={loadingAlts}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors disabled:opacity-50"
            >
              {loadingAlts ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs font-medium">Generating Alternative Texts...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-xs font-medium">Generate Alternative Texts</span>
                  <span className="text-[9px] opacity-70">(for text overflow issues)</span>
                </>
              )}
            </button>
          ) : (
            /* 리스트 표시 상태 */
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">
                    Alternative Texts
                  </span>
                  <span className="text-[8px] text-amber-500/70">(when font reduction is not viable)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlternatives([]);
                    fetchAlternatives();
                  }}
                  className="p-1 text-amber-500/50 hover:text-amber-500 transition-colors"
                  title="Regenerate"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Alt Items */}
              <div className="space-y-1.5">
                {alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(alt);
                    }}
                    className="group flex items-center w-full p-2 rounded bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="text-amber-500/70 font-mono text-xs mr-2">{i + 1}.</span>
                    <span className="flex-1 text-sm text-gray-200">{alt}</span>
                    <svg
                      className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copied === alt && (
                      <span className="ml-2 text-xs text-green-400">Copied!</span>
                    )}
                  </button>
                ))}
              </div>

              <p className="mt-2 text-[9px] text-gray-500">
                * Click to copy. Shorter alternatives are more likely to fit the UI.
              </p>
            </>
          )}
        </div>
      )}
    </motion.article>
  );
}
