import type { AnalyzeResponse, LocalizationIssue, FileAnalysisResult } from "../types";

// ─── Mock 이슈 데이터 ────────────────────────────────────

const MOCK_IMAGE_ISSUES: LocalizationIssue[] = [
  {
    id: "issue-1",
    type: "TEXT_TRUNCATION",
    severity: "HIGH",
    description: "Menu button text is truncated in Japanese localization. The full text 'オプション設定' is cut off.",
    location: { x1: 680, y1: 45, x2: 820, y2: 85 },
    language: "ja-JP",
    suggestion: "버튼 너비를 확장하거나 텍스트를 축약하세요 (예: 'オプション' → '設定')",
    original_text: "オプション設...",
  },
  {
    id: "issue-2",
    type: "TEXT_OVERFLOW",
    severity: "MEDIUM",
    description: "German translation overflows the dialog box container. 'Spieleinstellungen ändern' exceeds button width.",
    location: { x1: 200, y1: 300, x2: 500, y2: 360 },
    language: "de-DE",
    suggestion: "대화 상자 너비를 늘리거나 독일어 텍스트를 축약하세요",
    original_text: "Spieleinstellungen ändern",
  },
  {
    id: "issue-3",
    type: "UNTRANSLATED",
    severity: "HIGH",
    description: "Navigation label remains in English in Korean localized build.",
    location: { x1: 50, y1: 150, x2: 200, y2: 190 },
    language: "ko-KR",
    suggestion: "'Settings'를 '설정'으로 번역하세요",
    original_text: "Settings",
  },
  {
    id: "issue-4",
    type: "FONT_RENDERING",
    severity: "LOW",
    description: "Vietnamese diacritics are partially clipped on the tooltip text.",
    location: { x1: 400, y1: 500, x2: 600, y2: 540 },
    language: "vi-VN",
    suggestion: "폰트 라인 높이를 늘려 베트남어 성조 기호가 잘리지 않도록 하세요",
    original_text: "Cài đặt trò chơi",
  },
  {
    id: "issue-5",
    type: "OVERLAP",
    severity: "MEDIUM",
    description: "Chinese simplified text overlaps with the adjacent icon due to longer string length.",
    location: { x1: 750, y1: 600, x2: 950, y2: 650 },
    language: "zh-CN",
    suggestion: "아이콘과 텍스트 사이 간격을 확보하거나 텍스트를 축약하세요",
    original_text: "游戏设置选项",
  },
];

const MOCK_VIDEO_ISSUES: LocalizationIssue[] = [
  {
    id: "video-issue-1",
    type: "TEXT_TRUNCATION",
    severity: "HIGH",
    description: "Subtitle text truncated during cutscene dialog.",
    location: { x1: 100, y1: 800, x2: 900, y2: 880 },
    language: "ja-JP",
    suggestion: "자막 영역 높이를 확장하거나 텍스트를 분할하세요",
    timestamp: "0:15.3",
    original_text: "冒険者の皆さん、これから始まる...",
  },
  {
    id: "video-issue-2",
    type: "PLACEHOLDER_VISIBLE",
    severity: "HIGH",
    description: "Placeholder variable {player_name} visible in HUD.",
    location: { x1: 50, y1: 50, x2: 300, y2: 90 },
    language: "de-DE",
    suggestion: "변수 바인딩이 누락되었습니다. {player_name} 치환을 확인하세요",
    timestamp: "0:42.7",
    original_text: "Willkommen, {player_name}!",
  },
  {
    id: "video-issue-3",
    type: "LAYOUT_BREAK",
    severity: "MEDIUM",
    description: "Inventory menu layout breaks when switching to French locale.",
    location: { x1: 300, y1: 200, x2: 700, y2: 600 },
    language: "fr-FR",
    suggestion: "인벤토리 그리드 레이아웃을 유연하게 변경하세요 (flex-wrap 적용)",
    timestamp: "1:05.2",
    original_text: "Équipement du personnage",
  },
  {
    id: "video-issue-4",
    type: "ENCODING_ERROR",
    severity: "HIGH",
    description: "Korean text shows encoding artifacts in skill description tooltip.",
    location: { x1: 500, y1: 400, x2: 800, y2: 480 },
    language: "ko-KR",
    suggestion: "UTF-8 인코딩을 확인하고 BOM 없는 UTF-8로 저장하세요",
    timestamp: "1:38.5",
    original_text: "스킬 ë설명이 ê¹¨ì ¸...",
  },
];

// ─── Mock 응답 생성 함수 ─────────────────────────────────

export function getMockResponseForFiles(
  files: File[],
  inputType: "image" | "video" = "image"
): AnalyzeResponse {
  const startTime = Date.now();

  let results: FileAnalysisResult[];

  if (inputType === "video") {
    results = files.map((file) => ({
      filename: file.name,
      issues: MOCK_VIDEO_ISSUES.map((issue) => ({
        ...issue,
        frame_url: file.name,
      })),
    }));
  } else {
    results = files.map((file, fileIdx) => {
      // 각 파일에 2-3개의 이슈를 랜덤 할당
      const startIdx = (fileIdx * 2) % MOCK_IMAGE_ISSUES.length;
      const count = 2 + (fileIdx % 2); // 2 or 3
      const fileIssues: LocalizationIssue[] = [];
      for (let i = 0; i < count; i++) {
        const issue = MOCK_IMAGE_ISSUES[(startIdx + i) % MOCK_IMAGE_ISSUES.length];
        fileIssues.push({
          ...issue,
          id: `${file.name}-issue-${i + 1}`,
          frame_url: file.name,
        });
      }
      return { filename: file.name, issues: fileIssues };
    });
  }

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  return {
    success: true,
    provider: "mock",
    input_type: inputType,
    total_issues: totalIssues,
    processing_time: (Date.now() - startTime) / 1000,
    results,
    analyzed_frames: inputType === "video" ? 24 : undefined,
  };
}
