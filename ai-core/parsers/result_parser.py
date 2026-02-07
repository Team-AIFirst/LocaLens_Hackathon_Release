"""
AI 응답 파서
- JSON 추출, 좌표 정규화, 이슈 검증
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from contracts.types import (
    LocalizationIssue, BoundingBox, IssueType, IssueSeverity,
)


def extract_json_from_response(response_text: str) -> Optional[str]:
    """AI 응답에서 JSON 문자열 추출"""
    # ```json ... ``` 블록
    match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", response_text)
    if match:
        return match.group(1).strip()

    # 직접 [ 로 시작하는 JSON 배열
    match = re.search(r"(\[[\s\S]*\])", response_text)
    if match:
        return match.group(1).strip()

    return None


def parse_issue_dict(item: dict, index: int = 0) -> Optional[LocalizationIssue]:
    """딕셔너리를 LocalizationIssue로 변환"""
    try:
        # 필수 필드
        issue_type = item.get("type", "")
        severity = item.get("severity", "")
        description = item.get("description", "")
        location = item.get("location", {})
        language = item.get("language", "")
        suggestion = item.get("suggestion", "")

        if not all([issue_type, severity, description, location, language, suggestion]):
            return None

        # enum 검증
        try:
            it = IssueType(issue_type)
        except ValueError:
            return None
        try:
            sev = IssueSeverity(severity)
        except ValueError:
            return None

        bbox = BoundingBox(
            x1=float(location.get("x1", 0)),
            y1=float(location.get("y1", 0)),
            x2=float(location.get("x2", 0)),
            y2=float(location.get("y2", 0)),
        )

        return LocalizationIssue(
            id=item.get("id", f"issue-{index+1}"),
            type=it,
            severity=sev,
            description=description,
            location=bbox,
            language=language,
            suggestion=suggestion,
            timestamp=item.get("timestamp"),
            frame_url=item.get("frame_url"),
            original_text=item.get("original_text"),
            alternative_texts=item.get("alternative_texts"),
        )
    except Exception:
        return None


def normalize_coordinates(location: BoundingBox) -> BoundingBox:
    """좌표가 1000을 초과하면 정규화 (픽셀 → 0-1000)"""
    max_val = max(location.x1, location.y1, location.x2, location.y2)
    if max_val <= 1000:
        return location

    # 일반적인 해상도 추정
    if max_val > 1920:
        scale_x = 1000.0 / 3840
        scale_y = 1000.0 / 2160
    elif max_val > 1280:
        scale_x = 1000.0 / 1920
        scale_y = 1000.0 / 1080
    else:
        scale_x = 1000.0 / 1280
        scale_y = 1000.0 / 720

    return BoundingBox(
        x1=round(location.x1 * scale_x, 1),
        y1=round(location.y1 * scale_y, 1),
        x2=round(location.x2 * scale_x, 1),
        y2=round(location.y2 * scale_y, 1),
    )


def validate_issues(issues: List[LocalizationIssue]) -> List[LocalizationIssue]:
    """중복 제거, 좌표 정규화, 유효하지 않은 박스 제거"""
    seen_ids = set()
    valid: List[LocalizationIssue] = []

    for issue in issues:
        if issue.id in seen_ids:
            continue
        seen_ids.add(issue.id)

        issue.location = normalize_coordinates(issue.location)

        # 유효하지 않은 바운딩박스 제거
        loc = issue.location
        if loc.x1 >= loc.x2 or loc.y1 >= loc.y2:
            continue

        valid.append(issue)

    return valid


def parse_ai_response(response_text: str) -> List[LocalizationIssue]:
    """AI 응답 전체를 파싱하여 이슈 목록 반환"""
    json_str = extract_json_from_response(response_text)
    if not json_str:
        return []

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        return []

    if not isinstance(data, list):
        return []

    issues: List[LocalizationIssue] = []
    for idx, item in enumerate(data):
        if isinstance(item, dict):
            issue = parse_issue_dict(item, idx)
            if issue:
                issues.append(issue)

    return validate_issues(issues)


def translate_suggestion_to_korean(suggestion: str) -> str:
    """영어 suggestion을 한글로 번역 (키워드 기반)"""
    # 이미 한글이 포함되어 있으면 반환
    if re.search(r"[\uac00-\ud7af]", suggestion):
        return suggestion

    translations = {
        "reduce font size": "폰트 크기를 줄이세요",
        "expand button width": "버튼 너비를 확장하세요",
        "text wrapping": "텍스트 줄바꿈을 적용하세요",
        "increase container": "컨테이너 크기를 늘리세요",
        "truncate": "텍스트를 축약하세요",
        "translate": "텍스트를 번역하세요",
        "fix encoding": "인코딩을 수정하세요",
        "adjust alignment": "정렬을 조정하세요",
        "add padding": "패딩을 추가하세요",
        "resize": "크기를 조정하세요",
    }

    lower = suggestion.lower()
    for key, val in translations.items():
        if key in lower:
            return val

    return f"수정 필요: {suggestion}"
