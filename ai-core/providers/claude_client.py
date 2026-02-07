"""
Claude Vision 클라이언트
모델: claude-opus-4
"""

import os
import sys
import json
import base64
from pathlib import Path
from typing import List

import anthropic

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from contracts.types import LocalizationIssue

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from prompts.image_analysis import IMAGE_SYSTEM_PROMPT, IMAGE_USER_PROMPT
from parsers.result_parser import parse_ai_response, validate_issues, translate_suggestion_to_korean
from providers.base import VisionProvider


def _detect_media_type(image_bytes: bytes) -> str:
    """이미지 바이트에서 media_type 감지"""
    if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    elif image_bytes[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    elif image_bytes[:4] == b"GIF8":
        return "image/gif"
    elif image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
        return "image/webp"
    return "image/png"


class ClaudeClient(VisionProvider):
    """Anthropic Claude 비전 클라이언트"""

    def __init__(self):
        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key:
            raise ValueError("CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.")
        self._client = anthropic.Anthropic(api_key=api_key)
        self._model = "claude-opus-4"

    @property
    def name(self) -> str:
        return "claude"

    @property
    def supports_video(self) -> bool:
        return False

    def analyze_image(self, image_bytes: bytes) -> List[LocalizationIssue]:
        b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        media_type = _detect_media_type(image_bytes)

        response = self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=IMAGE_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": IMAGE_USER_PROMPT,
                        },
                    ],
                }
            ],
        )

        text = response.content[0].text
        issues = parse_ai_response(text)
        for issue in issues:
            issue.suggestion = translate_suggestion_to_korean(issue.suggestion)
        return validate_issues(issues)

    def analyze_video(self, video_bytes: bytes) -> List[LocalizationIssue]:
        raise NotImplementedError(
            "Claude는 비디오 분석을 지원하지 않습니다. Gemini를 사용해 주세요."
        )

    def generate_alternative_texts(
        self, original_text: str, language: str, context: str | None = None
    ) -> List[str]:
        ctx = f" (UI 요소: {context})" if context else ""
        prompt = (
            f"다음 텍스트의 짧은 대체 문장을 2-3개 생성해줘.\n"
            f"원본: {original_text}\n"
            f"언어: {language}{ctx}\n"
            f"같은 언어로, 더 짧게 작성해줘.\n"
            f'JSON 배열로만 응답해줘. 예: ["대체1", "대체2", "대체3"]'
        )
        response = self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            text = response.content[0].text.strip()
            if "[" in text:
                start = text.index("[")
                end = text.rindex("]") + 1
                return json.loads(text[start:end])
        except Exception:
            pass
        return [original_text[:10] + "...", original_text[:8], original_text[:6]]
