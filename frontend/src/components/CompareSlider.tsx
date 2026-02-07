import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function CompareSlider() {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(5, Math.min(95, pct)));
  }, []);

  const onPointerDown = () => {
    dragging.current = true;
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) handleMove(e.clientX);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-5xl mx-auto"
    >
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative rounded-sm border border-white/10 overflow-hidden select-none touch-none"
        style={{ height: 400 }}
      >
        {/* LEFT — Traditional QA */}
        <div
          className="absolute inset-0 bg-graphite-900 p-8 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className="h-full flex flex-col">
            <span className="text-xs font-mono text-gray-500 mb-4 uppercase tracking-wider">
              Traditional QA
            </span>
            <div className="space-y-4 flex-1">
              <div className="rounded-sm bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-gray-500 font-mono">Bug #2847</p>
                <p className="text-sm text-gray-300 mt-2">
                  "텍스트가 잘려요. 어딘가 메뉴에서요."
                </p>
                <p className="text-xs text-gray-500 mt-2">위치: 불명확</p>
                <p className="text-xs text-gray-500">스크린샷: 없음</p>
              </div>
              <div className="rounded-sm bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-gray-500 font-mono">Bug #2848</p>
                <p className="text-sm text-gray-300 mt-2">
                  "독일어가 너무 길어서 UI 깨짐"
                </p>
                <p className="text-xs text-gray-500 mt-2">심각도: 모름</p>
                <p className="text-xs text-gray-500">재현: 수동 검토 필요</p>
              </div>
              <div className="rounded-sm bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-400">⚠ 수동 검토 소요: ~4시간</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — LocaLens */}
        <div
          className="absolute inset-0 bg-graphite-950 p-8 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <div className="h-full flex flex-col">
            <span className="text-xs font-mono text-primary-500/70 mb-4 uppercase tracking-wider">
              LocaLens AI
            </span>
            <div className="space-y-4 flex-1">
              <div className="rounded-sm bg-primary-500/5 border border-primary-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-sm bg-accent-red/20 text-accent-red font-bold">HIGH</span>
                  <span className="text-xs text-gray-500">TEXT_TRUNCATION</span>
                </div>
                <p className="text-sm text-gray-200">
                  Japanese menu button text truncated
                </p>
                <p className="text-xs text-primary-500/70 font-mono mt-2">
                  [680, 45] → [820, 85]
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  💡 버튼 너비를 확장하세요
                </p>
              </div>
              <div className="rounded-sm bg-primary-500/5 border border-primary-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-sm bg-primary-500/20 text-primary-500 font-bold">MEDIUM</span>
                  <span className="text-xs text-gray-500">TEXT_OVERFLOW</span>
                </div>
                <p className="text-sm text-gray-200">
                  German translation overflows dialog box
                </p>
                <p className="text-xs text-primary-500/70 font-mono mt-2">
                  [200, 300] → [500, 360]
                </p>
              </div>
              <div className="rounded-sm bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-xs text-green-400">✓ AI 분석 완료: ~5초</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-primary-500 z-20 cursor-col-resize"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          onPointerDown={onPointerDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-glow-yellow">
            <span className="text-graphite-900 text-xs font-bold">⇔</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        {[
          { label: "시간 절감", value: "90%", sub: "4시간 → 5초" },
          { label: "정확도", value: "11 types", sub: "자동 분류 + 좌표" },
          { label: "커버리지", value: "Multi-lang", sub: "ja, de, ko, zh, fr, vi..." },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center rounded-sm bg-white/5 border border-white/5 py-4"
          >
            <p className="text-2xl font-bold text-primary-500">{s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            <p className="text-xs text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
