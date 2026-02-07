import { motion, AnimatePresence } from "framer-motion";

interface ScanningOverlayProps {
  isScanning: boolean;
  progress?: number;
}

export default function ScanningOverlay({ isScanning, progress }: ScanningOverlayProps) {
  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-lg"
        >
          {/* Scan line with glow */}
          <div className="absolute inset-x-0 animate-scan-line">
            {/* Main line */}
            <div className="h-0.5 bg-cyan-400" />
            {/* Glow effect below */}
            <div className="h-24 bg-gradient-to-b from-cyan-400/30 to-transparent" />
          </div>

          {/* Status indicator at bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-sm border border-cyan-400/30">
              {/* Animated dots */}
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-cyan-400 dot-blink-1" />
                <span className="w-1 h-1 rounded-full bg-cyan-400 dot-blink-2" />
                <span className="w-1 h-1 rounded-full bg-cyan-400 dot-blink-3" />
              </div>
              
              {/* Status text */}
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase">
                AI Analyzing
              </span>
              
              {/* Progress */}
              {progress != null && (
                <span className="text-[10px] font-mono text-cyan-400">
                  {Math.min(progress, 100)}%
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
