// ─── Enums / Literals ────────────────────────────────────

export type InputType = "image" | "video";
export type AIProvider = "gemini" | "claude";

export type IssueType =
  | "TEXT_TRUNCATION"
  | "TEXT_OVERFLOW"
  | "TEXT_SCALING"
  | "FONT_RENDERING"
  | "ENCODING_ERROR"
  | "UNTRANSLATED"
  | "PLACEHOLDER_VISIBLE"
  | "LAYOUT_BREAK"
  | "OVERLAP"
  | "ALIGNMENT"
  | "CULTURAL_ISSUE";

export type IssueSeverity = "HIGH" | "MEDIUM" | "LOW";

// ─── Interfaces ──────────────────────────────────────────

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LocalizationIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  location: BoundingBox;
  language: string;
  suggestion: string;
  timestamp?: string;
  frame_url?: string;
  original_text?: string;
  alternative_texts?: string[];
}

export interface FileAnalysisResult {
  filename: string;
  issues: LocalizationIssue[];
}

export interface AnalyzeResponse {
  success: boolean;
  provider: string;
  input_type: string;
  total_issues: number;
  processing_time: number;
  results: FileAnalysisResult[];
  analyzed_frames?: number;
}

// ─── Meta / Constants ────────────────────────────────────

export interface ProviderMeta {
  label: string;
  description: string;
  icon: string;
  supportsVideo: boolean;
}

export const PROVIDER_META: Record<AIProvider, ProviderMeta> = {
  gemini: {
    label: "Google Gemini",
    description: "gemini-3-flash-preview — 이미지 & 비디오 지원",
    icon: "✦",
    supportsVideo: true,
  },
  claude: {
    label: "Anthropic Claude",
    description: "claude-opus-4 — 이미지만 지원 (높은 정확도)",
    icon: "◈",
    supportsVideo: false,
  },
};

export interface IssueTypeMeta {
  label: string;
  icon: string;
  description: string;
}

export const ISSUE_TYPE_META: Record<IssueType, IssueTypeMeta> = {
  TEXT_TRUNCATION: { label: "Text Truncation", icon: "✂️", description: "텍스트가 잘림" },
  TEXT_OVERFLOW: { label: "Text Overflow", icon: "📏", description: "텍스트가 영역을 넘침" },
  TEXT_SCALING: { label: "Text Scaling", icon: "🔍", description: "텍스트 크기 문제" },
  FONT_RENDERING: { label: "Font Rendering", icon: "🔤", description: "폰트 렌더링 문제" },
  ENCODING_ERROR: { label: "Encoding Error", icon: "⚠️", description: "인코딩 오류" },
  UNTRANSLATED: { label: "Untranslated", icon: "🌐", description: "미번역 텍스트" },
  PLACEHOLDER_VISIBLE: { label: "Placeholder Visible", icon: "🏷️", description: "플레이스홀더 노출" },
  LAYOUT_BREAK: { label: "Layout Break", icon: "📐", description: "레이아웃 깨짐" },
  OVERLAP: { label: "Overlap", icon: "🔲", description: "요소 겹침" },
  ALIGNMENT: { label: "Alignment", icon: "↔️", description: "정렬 문제" },
  CULTURAL_ISSUE: { label: "Cultural Issue", icon: "🌍", description: "문화적 이슈" },
};

export interface SeverityMeta {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SEVERITY_META: Record<IssueSeverity, SeverityMeta> = {
  HIGH: {
    label: "High",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  LOW: {
    label: "Low",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
};

export const ALL_ISSUE_TYPES: IssueType[] = [
  "TEXT_TRUNCATION",
  "TEXT_OVERFLOW",
  "TEXT_SCALING",
  "FONT_RENDERING",
  "ENCODING_ERROR",
  "UNTRANSLATED",
  "PLACEHOLDER_VISIBLE",
  "LAYOUT_BREAK",
  "OVERLAP",
  "ALIGNMENT",
  "CULTURAL_ISSUE",
];
