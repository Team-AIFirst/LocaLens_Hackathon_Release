"""
Gemini Vision 클라이언트
모델: gemini-3-flash-preview
새 google.genai SDK 사용
"""

import io
import os
import sys
import json
import time
import tempfile
from pathlib import Path
from typing import List

from PIL import Image
from google import genai
from google.genai import types

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from contracts.types import LocalizationIssue

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from prompts.image_analysis import IMAGE_SYSTEM_PROMPT, IMAGE_USER_PROMPT
from prompts.video_analysis import VIDEO_SYSTEM_PROMPT, VIDEO_USER_PROMPT
from parsers.result_parser import parse_ai_response, validate_issues, translate_suggestion_to_korean
from providers.base import VisionProvider


class GeminiClient(VisionProvider):
    """Google Gemini 비전 클라이언트 (google-genai SDK)"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        self._client = genai.Client(api_key=api_key)
        self._model = "gemini-3-flash-preview"

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def supports_video(self) -> bool:
        return True

    def analyze_image(self, image_bytes: bytes) -> List[LocalizationIssue]:
        prompt = f"{IMAGE_SYSTEM_PROMPT}\n\n{IMAGE_USER_PROMPT}"

        response = self._client.models.generate_content(
            model=self._model,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(data=image_bytes, mime_type=self._detect_image_mime(image_bytes)),
                    ],
                )
            ],
            config=types.GenerateContentConfig(temperature=0.2),
        )

        issues = parse_ai_response(response.text)
        for issue in issues:
            issue.suggestion = translate_suggestion_to_korean(issue.suggestion)
        return validate_issues(issues)

    def analyze_video(self, video_bytes: bytes) -> List[LocalizationIssue]:
        # 임시 파일로 저장 후 업로드
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            # 파일 업로드
            uploaded = self._client.files.upload(file=tmp_path)

            # 처리 완료 대기
            while uploaded.state == "PROCESSING":
                time.sleep(2)
                uploaded = self._client.files.get(name=uploaded.name)

            if uploaded.state == "FAILED":
                raise RuntimeError("비디오 처리 실패")

            prompt = f"{VIDEO_SYSTEM_PROMPT}\n\n{VIDEO_USER_PROMPT}"

            response = self._client.models.generate_content(
                model=self._model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_uri(file_uri=uploaded.uri, mime_type=uploaded.mime_type),
                            types.Part.from_text(text=prompt),
                        ],
                    )
                ],
                config=types.GenerateContentConfig(temperature=0.2),
            )

            issues = parse_ai_response(response.text)
            for issue in issues:
                issue.suggestion = translate_suggestion_to_korean(issue.suggestion)

            # 업로드 파일 삭제
            try:
                self._client.files.delete(name=uploaded.name)
            except Exception:
                pass

            return validate_issues(issues)
        finally:
            os.unlink(tmp_path)

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
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.5),
        )
        try:
            text = response.text.strip()
            if "[" in text:
                start = text.index("[")
                end = text.rindex("]") + 1
                return json.loads(text[start:end])
        except Exception:
            pass
        return [original_text[:10] + "...", original_text[:8], original_text[:6]]

    @staticmethod
    def _detect_image_mime(image_bytes: bytes) -> str:
        if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            return "image/png"
        elif image_bytes[:3] == b"\xff\xd8\xff":
            return "image/jpeg"
        elif image_bytes[:4] == b"GIF8":
            return "image/gif"
        elif image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
            return "image/webp"
        return "image/png"
