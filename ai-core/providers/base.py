"""
VisionProvider 추상 베이스 클래스 + 팩토리 함수
"""

import sys
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List

# contracts import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from contracts.types import LocalizationIssue


class VisionProvider(ABC):
    """AI 비전 분석 프로바이더 추상 클래스"""

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def supports_video(self) -> bool:
        ...

    @abstractmethod
    def analyze_image(self, image_bytes: bytes) -> List[LocalizationIssue]:
        ...

    @abstractmethod
    def analyze_video(self, video_bytes: bytes) -> List[LocalizationIssue]:
        ...

    @abstractmethod
    def generate_alternative_texts(
        self, original_text: str, language: str, context: str | None = None
    ) -> List[str]:
        ...


def get_provider(provider_name: str) -> VisionProvider:
    """프로바이더 팩토리 함수"""
    if provider_name == "gemini":
        from providers.gemini_client import GeminiClient
        return GeminiClient()
    elif provider_name == "claude":
        from providers.claude_client import ClaudeClient
        return ClaudeClient()
    else:
        raise ValueError(f"Unknown provider: {provider_name}")
