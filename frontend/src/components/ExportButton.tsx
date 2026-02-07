import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LocalizationIssue } from "../types";

interface ExportButtonProps {
  issues: LocalizationIssue[];
  filename?: string;
}

type ExportFormat = "json" | "csv" | "markdown";

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(issues: LocalizationIssue[]): string {
  const header = "ID,Type,Severity,Description,Language,Location,Timestamp,Suggestion";
  const rows = issues.map((i) =>
    [
      i.id,
      i.type,
      i.severity,
      `"${i.description.replace(/"/g, '""')}"`,
      i.language,
      `"[${i.location.x1},${i.location.y1}]->[${i.location.x2},${i.location.y2}]"`,
      i.timestamp || "",
      `"${i.suggestion.replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function toMarkdown(issues: LocalizationIssue[]): string {
  const header = "| # | Type | Severity | Description | Language | Suggestion |";
  const sep = "|---|------|----------|-------------|----------|------------|";
  const rows = issues.map(
    (i, idx) =>
      `| ${idx + 1} | ${i.type} | ${i.severity} | ${i.description} | ${i.language} | ${i.suggestion} |`
  );
  return [header, sep, ...rows].join("\n");
}

export default function ExportButton({ issues, filename = "localens" }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exportAs = (format: ExportFormat) => {
    setOpen(false);
    const base = `${filename}_report`;
    switch (format) {
      case "json":
        download(JSON.stringify(issues, null, 2), `${base}.json`, "application/json");
        break;
      case "csv":
        download(toCSV(issues), `${base}.csv`, "text/csv");
        break;
      case "markdown":
        download(toMarkdown(issues), `${base}.md`, "text/markdown");
        break;
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 transition-colors"
      >
        <span>📥</span>
        Export
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-neutral-900 border border-white/10 overflow-hidden z-50"
          >
            {(
              [
                { format: "json" as const, label: "JSON", icon: "{ }" },
                { format: "csv" as const, label: "CSV", icon: "📊" },
                { format: "markdown" as const, label: "Markdown", icon: "📝" },
              ] as const
            ).map((item) => (
              <button
                key={item.format}
                onClick={() => exportAs(item.format)}
                className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 flex items-center gap-2 transition-colors"
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
