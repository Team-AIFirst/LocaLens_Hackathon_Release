"""
LocaLens 공유 타입 정의
Python 타입 (Backend + AI Core 공용)
"""

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel


# ─── Enums ────────────────────────────────────────────────

class InputType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class AIProvider(str, Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"


class IssueType(str, Enum):
    TEXT_TRUNCATION = "TEXT_TRUNCATION"
    TEXT_OVERFLOW = "TEXT_OVERFLOW"
    TEXT_SCALING = "TEXT_SCALING"
    FONT_RENDERING = "FONT_RENDERING"
    ENCODING_ERROR = "ENCODING_ERROR"
    UNTRANSLATED = "UNTRANSLATED"
    PLACEHOLDER_VISIBLE = "PLACEHOLDER_VISIBLE"
    LAYOUT_BREAK = "LAYOUT_BREAK"
    OVERLAP = "OVERLAP"
    ALIGNMENT = "ALIGNMENT"
    CULTURAL_ISSUE = "CULTURAL_ISSUE"


class IssueSeverity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# ─── Models ───────────────────────────────────────────────

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class LocalizationIssue(BaseModel):
    id: str
    type: IssueType
    severity: IssueSeverity
    description: str
    location: BoundingBox
    language: str
    suggestion: str
    timestamp: Optional[str] = None       # 비디오 전용 (예: "1:23")
    frame_url: Optional[str] = None       # 파일명 참조
    original_text: Optional[str] = None   # 원본 텍스트
    alternative_texts: Optional[List[str]] = None  # 대체 문장 목록


class FileAnalysisResult(BaseModel):
    filename: str
    issues: List[LocalizationIssue]


class AnalyzeResponse(BaseModel):
    success: bool
    provider: str
    input_type: str
    total_issues: int
    processing_time: float
    results: List[FileAnalysisResult]
    analyzed_frames: Optional[int] = None  # 비디오 전용
