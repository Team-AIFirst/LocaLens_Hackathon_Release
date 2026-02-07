"""
분석 API 라우터
POST /api/analyze
POST /api/generate-alternatives
"""

import os
import sys
import time
import uuid
import random
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

# contracts import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))
from contracts.types import (
    InputType, AIProvider, IssueType, IssueSeverity,
    BoundingBox, LocalizationIssue, FileAnalysisResult, AnalyzeResponse,
)

from app.services.file_handler import validate_files, get_file_bytes

router = APIRouter(prefix="/api", tags=["Analysis"])

# ─── Mock 데이터 생성 헬퍼 ────────────────────────────────

MOCK_ISSUE_TEMPLATES = [
    {
        "type": IssueType.TEXT_TRUNCATION,
        "severity": IssueSeverity.HIGH,
        "description": "Menu button text is truncated in Japanese localization.",
        "location": BoundingBox(x1=680, y1=45, x2=820, y2=85),
        "language": "ja-JP",
        "suggestion": "버튼 너비를 확장하거나 텍스트를 축약하세요",
        "original_text": "オプション設...",
    },
    {
        "type": IssueType.TEXT_OVERFLOW,
        "severity": IssueSeverity.MEDIUM,
        "description": "German translation overflows the dialog box.",
        "location": BoundingBox(x1=200, y1=300, x2=500, y2=360),
        "language": "de-DE",
        "suggestion": "대화 상자 너비를 늘리거나 독일어 텍스트를 축약하세요",
        "original_text": "Spieleinstellungen ändern",
    },
    {
        "type": IssueType.UNTRANSLATED,
        "severity": IssueSeverity.HIGH,
        "description": "Navigation label remains in English in Korean build.",
        "location": BoundingBox(x1=50, y1=150, x2=200, y2=190),
        "language": "ko-KR",
        "suggestion": "'Settings'를 '설정'으로 번역하세요",
        "original_text": "Settings",
    },
    {
        "type": IssueType.FONT_RENDERING,
        "severity": IssueSeverity.LOW,
        "description": "Vietnamese diacritics are partially clipped.",
        "location": BoundingBox(x1=400, y1=500, x2=600, y2=540),
        "language": "vi-VN",
        "suggestion": "폰트 라인 높이를 늘려 성조 기호가 잘리지 않도록 하세요",
        "original_text": "Cài đặt trò chơi",
    },
    {
        "type": IssueType.OVERLAP,
        "severity": IssueSeverity.MEDIUM,
        "description": "Chinese text overlaps with adjacent icon.",
        "location": BoundingBox(x1=750, y1=600, x2=950, y2=650),
        "language": "zh-CN",
        "suggestion": "아이콘과 텍스트 사이 간격을 확보하세요",
        "original_text": "游戏设置选项",
    },
]

MOCK_VIDEO_TEMPLATES = [
    {
        "type": IssueType.TEXT_TRUNCATION,
        "severity": IssueSeverity.HIGH,
        "description": "Subtitle text truncated during cutscene dialog.",
        "location": BoundingBox(x1=100, y1=800, x2=900, y2=880),
        "language": "ja-JP",
        "suggestion": "자막 영역 높이를 확장하거나 텍스트를 분할하세요",
        "timestamp": "0:15.3",
        "original_text": "冒険者の皆さん...",
    },
    {
        "type": IssueType.PLACEHOLDER_VISIBLE,
        "severity": IssueSeverity.HIGH,
        "description": "Placeholder {player_name} visible in HUD.",
        "location": BoundingBox(x1=50, y1=50, x2=300, y2=90),
        "language": "de-DE",
        "suggestion": "변수 바인딩이 누락되었습니다. {player_name} 치환을 확인하세요",
        "timestamp": "0:42.7",
        "original_text": "Willkommen, {player_name}!",
    },
    {
        "type": IssueType.LAYOUT_BREAK,
        "severity": IssueSeverity.MEDIUM,
        "description": "Inventory menu layout breaks in French locale.",
        "location": BoundingBox(x1=300, y1=200, x2=700, y2=600),
        "language": "fr-FR",
        "suggestion": "인벤토리 그리드 레이아웃을 유연하게 변경하세요",
        "timestamp": "1:05.2",
        "original_text": "Équipement du personnage",
    },
    {
        "type": IssueType.ENCODING_ERROR,
        "severity": IssueSeverity.HIGH,
        "description": "Korean text shows encoding artifacts.",
        "location": BoundingBox(x1=500, y1=400, x2=800, y2=480),
        "language": "ko-KR",
        "suggestion": "UTF-8 인코딩을 확인하세요",
        "timestamp": "1:38.5",
        "original_text": "스킬 설명이 깨짐",
    },
]


def _generate_mock_issues(
    filename: str, input_type: str, count: int = 3
) -> List[LocalizationIssue]:
    templates = MOCK_VIDEO_TEMPLATES if input_type == "video" else MOCK_ISSUE_TEMPLATES
    issues: List[LocalizationIssue] = []
    for i in range(min(count, len(templates))):
        t = templates[i]
        issues.append(
            LocalizationIssue(
                id=f"{filename}-issue-{i+1}",
                type=t["type"],
                severity=t["severity"],
                description=t["description"],
                location=t["location"],
                language=t["language"],
                suggestion=t["suggestion"],
                timestamp=t.get("timestamp"),
                frame_url=filename,
                original_text=t.get("original_text"),
            )
        )
    return issues


# ─── POST /api/analyze ────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    files: List[UploadFile] = File(...),
    provider: str = Form("gemini"),
    input_type: str = Form("image"),
):
    start = time.time()

    # Claude + video 조합 차단
    if provider == "claude" and input_type == "video":
        raise HTTPException(status_code=400, detail="Claude는 비디오 분석을 지원하지 않습니다. Gemini를 사용해 주세요.")

    # 파일 검증
    it = InputType.IMAGE if input_type == "image" else InputType.VIDEO
    errors = await validate_files(files, it)
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    use_mock = os.getenv("USE_MOCK", "true").lower() == "true"

    if use_mock:
        # Mock 모드
        results: List[FileAnalysisResult] = []
        for f in files:
            count = random.randint(2, 3) if input_type == "image" else random.randint(3, 4)
            issues = _generate_mock_issues(f.filename or "unknown", input_type, count)
            results.append(FileAnalysisResult(filename=f.filename or "unknown", issues=issues))
    else:
        # 실제 AI 호출
        import importlib
        ai_core_path = str(Path(__file__).resolve().parent.parent.parent.parent / "ai-core")
        if ai_core_path not in sys.path:
            sys.path.insert(0, ai_core_path)

        try:
            import providers.base as _base_mod
            importlib.reload(_base_mod)
            import providers.gemini_client as _gc_mod
            importlib.reload(_gc_mod)
            vision_provider = _base_mod.get_provider(provider)
            print(f"[LocaLens] model={getattr(vision_provider, '_model', '?')}", flush=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI 프로바이더({provider}) 초기화 실패: {e}")

        file_bytes_list = await get_file_bytes(files)

        results = []
        for f, fb in zip(files, file_bytes_list):
            fname = f.filename or "unknown"
            try:
                if input_type == "video":
                    issues = vision_provider.analyze_video(fb)
                else:
                    issues = vision_provider.analyze_image(fb)
                for issue in issues:
                    issue.frame_url = fname
                results.append(FileAnalysisResult(filename=fname, issues=issues))
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"AI 분석 실패 ({fname}): {e}"
                )

    total_issues = sum(len(r.issues) for r in results)
    elapsed = time.time() - start

    return AnalyzeResponse(
        success=True,
        provider=provider,
        input_type=input_type,
        total_issues=total_issues,
        processing_time=round(elapsed, 2),
        results=results,
        analyzed_frames=24 if input_type == "video" else None,
    )


# ─── POST /api/generate-alternatives ─────────────────────

class AlternativesRequest(BaseModel):
    original_text: str
    language: str
    context: Optional[str] = None


class AlternativesResponse(BaseModel):
    success: bool
    original_text: str
    alternatives: List[str]


MOCK_ALTERNATIVES = {
    "ja-JP": ["オプション", "設定", "OP設定"],
    "de-DE": ["Einstell.", "Setup", "Opt."],
    "ko-KR": ["설정", "옵션", "세팅"],
    "zh-CN": ["设置", "选项", "配置"],
    "fr-FR": ["Paramètres", "Config.", "Régl."],
    "vi-VN": ["Cài đặt", "Tùy chọn", "Setup"],
}


@router.post("/generate-alternatives", response_model=AlternativesResponse)
async def generate_alternatives(req: AlternativesRequest):
    use_mock = os.getenv("USE_MOCK", "true").lower() == "true"

    if use_mock:
        lang_key = req.language if req.language in MOCK_ALTERNATIVES else "ko-KR"
        alts = MOCK_ALTERNATIVES.get(lang_key, ["대체 1", "대체 2", "대체 3"])
        return AlternativesResponse(
            success=True,
            original_text=req.original_text,
            alternatives=alts,
        )

    # 실제 AI 호출
    import importlib
    ai_core_path = str(Path(__file__).resolve().parent.parent.parent.parent / "ai-core")
    if ai_core_path not in sys.path:
        sys.path.insert(0, ai_core_path)

    try:
        import providers.base as _base_mod
        importlib.reload(_base_mod)
        import providers.gemini_client as _gc_mod
        importlib.reload(_gc_mod)
        vision_provider = _base_mod.get_provider("gemini")
        alts = vision_provider.generate_alternative_texts(
            req.original_text, req.language, req.context
        )
        return AlternativesResponse(
            success=True,
            original_text=req.original_text,
            alternatives=alts,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"대체 문장 생성 실패: {e}"
        )
