"""
파일 유효성 검사 및 바이트 읽기 서비스
"""

import sys
from pathlib import Path
from typing import List
from fastapi import UploadFile

# contracts import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))
from contracts.types import InputType

# 허용 확장자 및 크기 제한
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
IMAGE_MAX_SIZE = 10 * 1024 * 1024       # 10 MB
VIDEO_MAX_SIZE = 100 * 1024 * 1024      # 100 MB


async def validate_files(files: List[UploadFile], input_type: InputType) -> List[str]:
    """파일 유효성 검사. 오류 메시지 리스트를 반환 (빈 리스트 = 유효)."""
    errors: List[str] = []

    if not files:
        errors.append("파일이 제공되지 않았습니다.")
        return errors

    allowed_exts = IMAGE_EXTENSIONS if input_type == InputType.IMAGE else VIDEO_EXTENSIONS
    max_size = IMAGE_MAX_SIZE if input_type == InputType.IMAGE else VIDEO_MAX_SIZE

    for f in files:
        ext = Path(f.filename or "").suffix.lower()
        if ext not in allowed_exts:
            errors.append(
                f"'{f.filename}': 허용되지 않는 형식입니다. 허용: {', '.join(allowed_exts)}"
            )
        # 파일 크기 확인
        content = await f.read()
        await f.seek(0)
        if len(content) > max_size:
            errors.append(
                f"'{f.filename}': 파일 크기 초과 ({len(content) / 1024 / 1024:.1f}MB > {max_size / 1024 / 1024:.0f}MB)"
            )

    return errors


async def get_file_bytes(files: List[UploadFile]) -> List[bytes]:
    """파일들의 바이트 데이터를 반환."""
    result: List[bytes] = []
    for f in files:
        content = await f.read()
        await f.seek(0)
        result.append(content)
    return result
