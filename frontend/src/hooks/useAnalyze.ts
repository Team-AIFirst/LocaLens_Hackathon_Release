import { useState, useCallback } from "react";
import type { AIProvider, InputType, AnalyzeResponse } from "../types";
import { getMockResponseForFiles } from "../mocks/mockData";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const analyze = useCallback(
    async (files: File[], provider: AIProvider, inputType: InputType) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        if (USE_MOCK) {
          // Mock 모드 — 1.5초 딜레이
          await new Promise((r) => setTimeout(r, 1500));
          const mockResult = getMockResponseForFiles(files, inputType);
          setResult(mockResult);
        } else {
          // 실제 API 호출
          const formData = new FormData();
          files.forEach((f) => formData.append("files", f));
          formData.append("provider", provider);
          formData.append("input_type", inputType);

          const res = await fetch(`${API_BASE}/analyze`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.detail || `HTTP ${res.status}`);
          }

          const data: AnalyzeResponse = await res.json();
          setResult(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { loading, error, result, analyze, reset };
}
